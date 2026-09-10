from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import (
    Transaction,
    TransactionEvent,
    Dispute,
    Lot,
    Offer,
    Buyer,
    Farmer,
    Crop,
)
from app.schemas.buyer_matching import (
    LogisticsUpdateRequest,
    PaymentRecordRequest,
    DisputeCreateRequest,
    DisputeResolveRequest,
    TransactionDetailResponse,
    TransactionEventResponse,
    DisputeResponse,
)


class TransactionService:
    """
    Transaction, Logistics, Payment Tracking, and Dispute Service.
    Enforces a strict state machine, generates immutable audit trails,
    manages logistics fulfillment, and tracks settlement status.
    """

    VALID_TRANSITIONS = {
        "CREATED": ["CONFIRMED", "CANCELLED", "PICKUP_SCHEDULED"],
        "CONFIRMED": ["PICKUP_SCHEDULED", "IN_TRANSIT", "DELIVERED", "RECEIVED", "COMPLETED", "CANCELLED"],
        "PICKUP_SCHEDULED": ["IN_TRANSIT", "DELIVERED", "RECEIVED", "COMPLETED", "DISPUTED", "CANCELLED"],
        "IN_TRANSIT": ["DELIVERED", "RECEIVED", "COMPLETED", "DISPUTED"],
        "DELIVERED": ["PAYMENT_PENDING", "PAYMENT_RECEIVED", "RECEIVED", "DISPUTED", "COMPLETED"],
        "RECEIVED": ["PAYMENT_PENDING", "PAYMENT_RECEIVED", "DELIVERED", "COMPLETED", "DISPUTED"],
        "PAYMENT_PENDING": ["PAYMENT_RECEIVED", "DISPUTED", "COMPLETED", "DELIVERED", "RECEIVED"],
        "PAYMENT_RECEIVED": ["COMPLETED", "DELIVERED", "RECEIVED", "DISPUTED"],
        "COMPLETED": ["DISPUTED"],
        "DISPUTED": ["RESOLVED", "CANCELLED", "COMPLETED", "UNDER_REVIEW"],
        "CANCELLED": [],
    }

    def accept_offer_and_create_transaction(
        self,
        db: Session,
        offer_id: int,
    ) -> Transaction:
        """Atomic acceptance of offer and generation of verified transaction contract."""
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Offer with ID {offer_id} not found"
            )

        lot = db.query(Lot).filter(Lot.id == offer.lot_id).first()
        if not lot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lot with ID {offer.lot_id} not found"
            )

        # Check if transaction already exists for this lot
        existing_tx = db.query(Transaction).filter(Transaction.lot_id == lot.id).first()
        if existing_tx:
            # Update existing transaction
            existing_tx.offer_id = offer.id
            existing_tx.buyer_id = offer.buyer_id
            existing_tx.final_price = offer.counter_price or offer.offered_price
            existing_tx.quantity_kg = offer.quantity_kg or lot.quantity
            existing_tx.total_amount = existing_tx.final_price * existing_tx.quantity_kg
            existing_tx.status = "CONFIRMED"
            existing_tx.updated_at = datetime.utcnow()
            
            offer.status = "Accepted"
            lot.status = "ACCEPTED"
            lot.buyer_id = offer.buyer_id
            
            # Record audit event
            ev = TransactionEvent(
                transaction_id=existing_tx.id,
                stage_label="Offer Accepted",
                description=f"Offer of ₹{existing_tx.final_price:.2f}/kg accepted by farmer.",
                done=True,
            )
            db.add(ev)
            db.commit()
            db.refresh(existing_tx)
            return existing_tx

        # Create new Transaction
        price_per_kg = offer.counter_price or offer.offered_price
        qty_kg = offer.quantity_kg or lot.quantity
        total_amt = round(price_per_kg * qty_kg, 2)

        tx = Transaction(
            lot_id=lot.id,
            farmer_id=lot.farmer_id,
            buyer_id=offer.buyer_id,
            offer_id=offer.id,
            quantity_kg=qty_kg,
            final_price=price_per_kg,
            total_amount=total_amt,
            status="CONFIRMED",
            logistics_status="NOT_SCHEDULED",
            pickup_location=lot.location,
            payment_status="PENDING",
            expected_amount=total_amt,
            paid_amount=0.0,
            created_at=datetime.utcnow(),
        )
        db.add(tx)
        
        # Update offer and lot states
        offer.status = "Accepted"
        lot.status = "ACCEPTED"
        lot.buyer_id = offer.buyer_id
        
        db.flush()  # Generate tx.id

        # Add initial audit events
        ev1 = TransactionEvent(
            transaction_id=tx.id,
            stage_label="Offer Accepted",
            description=f"Offer from buyer accepted at ₹{price_per_kg:.2f}/kg ({qty_kg:,.0f} kg).",
            done=True,
        )
        ev2 = TransactionEvent(
            transaction_id=tx.id,
            stage_label="Transaction Confirmed",
            description=f"Direct trade contract created. Agreed total value: ₹{total_amt:,.2f}.",
            done=True,
        )
        db.add_all([ev1, ev2])

        # Reserve inventory stock for confirmed order
        from app.services.inventory_service import inventory_service
        crop_name = lot.crop.crop_name if lot.crop else "Produce"
        inventory_service.reserve_for_order(
            db=db,
            farmer_id=lot.farmer_id,
            crop_name=crop_name,
            quantity=qty_kg,
            transaction_id=tx.id,
        )

        db.commit()
        db.refresh(tx)
        return tx

    def update_transaction_status(
        self,
        db: Session,
        transaction_id: int,
        new_status: str,
        note: Optional[str] = None,
        user_role: Optional[str] = None,
    ) -> Transaction:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        # Enforce role safety: Seller (Farmer) cannot falsely mark their own sale as received
        if user_role and user_role.lower() == "farmer" and new_status in ["RECEIVED", "DELIVERED", "COMPLETED"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Farmers (sellers) cannot mark orders as received. Delivery confirmation and acceptance is reserved for the receiving Buyer."
            )

        current = tx.status
        allowed = self.VALID_TRANSITIONS.get(current, [])
        if new_status not in allowed and new_status != current:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state transition from '{current}' to '{new_status}'. Allowed transitions: {allowed}"
            )

        # Handle inventory state transitions
        terminal_success_states = ["COMPLETED", "DELIVERED", "RECEIVED"]
        if new_status in terminal_success_states and current not in terminal_success_states:
            from app.services.inventory_service import inventory_service
            lot = tx.lot
            crop_name = lot.crop.crop_name if lot and lot.crop else "Produce"
            farmer_id = tx.farmer_id or (lot.farmer_id if lot else 1)
            qty = tx.quantity_kg or (lot.quantity if lot else 0.0)
            if qty > 0:
                inventory_service.complete_order_sale(
                    db=db,
                    farmer_id=farmer_id,
                    crop_name=crop_name,
                    quantity=qty,
                    transaction_id=tx.id,
                )
            if lot:
                lot.status = "SOLD"
        elif new_status == "CANCELLED" and current != "CANCELLED":
            from app.services.inventory_service import inventory_service
            lot = tx.lot
            crop_name = lot.crop.crop_name if lot and lot.crop else "Produce"
            farmer_id = tx.farmer_id or (lot.farmer_id if lot else 1)
            qty = tx.quantity_kg or (lot.quantity if lot else 0.0)
            if qty > 0:
                inventory_service.release_from_order(
                    db=db,
                    farmer_id=farmer_id,
                    crop_name=crop_name,
                    quantity=qty,
                    transaction_id=tx.id,
                )

        tx.status = new_status
        if new_status in ["DELIVERED", "RECEIVED"]:
            tx.logistics_status = "DELIVERED"
        tx.updated_at = datetime.utcnow()

        # Append audit event
        ev = TransactionEvent(
            transaction_id=tx.id,
            stage_label=new_status.replace("_", " ").title(),
            description=note or f"Transaction status transitioned to {new_status}.",
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(tx)
        return tx

    def update_logistics(
        self,
        db: Session,
        transaction_id: int,
        req: LogisticsUpdateRequest,
    ) -> Transaction:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        tx.logistics_status = req.logistics_status
        if req.pickup_date:
            tx.pickup_date = req.pickup_date
        if req.pickup_location:
            tx.pickup_location = req.pickup_location
        if req.delivery_location:
            tx.delivery_location = req.delivery_location
        if req.transport_cost_actual is not None:
            tx.transport_cost_actual = req.transport_cost_actual

        # Sync transaction status if appropriate
        if req.logistics_status == "SCHEDULED" and tx.status in ["CREATED", "CONFIRMED"]:
            tx.status = "PICKUP_SCHEDULED"
        elif req.logistics_status == "PICKED_UP" or req.logistics_status == "IN_TRANSIT":
            tx.status = "IN_TRANSIT"
        elif req.logistics_status == "DELIVERED":
            tx.status = "DELIVERED"

        tx.updated_at = datetime.utcnow()

        ev = TransactionEvent(
            transaction_id=tx.id,
            stage_label=f"Logistics: {req.logistics_status.replace('_', ' ').title()}",
            description=f"Logistics updated. Pickup: {tx.pickup_location} → Delivery: {tx.delivery_location or 'Hub'}. Date: {tx.pickup_date or 'TBD'}",
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(tx)
        return tx

    def record_payment(
        self,
        db: Session,
        transaction_id: int,
        req: PaymentRecordRequest,
    ) -> Transaction:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        tx.paid_amount = req.paid_amount
        tx.payment_status = req.payment_status
        if req.payment_date:
            tx.payment_date = req.payment_date
        else:
            tx.payment_date = datetime.utcnow().strftime("%Y-%m-%d")
        if req.payment_reference:
            tx.payment_reference = req.payment_reference

        # Check completion
        expected = tx.expected_amount or tx.total_amount or 0.0
        if req.payment_status == "RECEIVED" or (req.paid_amount >= expected and expected > 0):
            tx.payment_status = "RECEIVED"
            if tx.status in ["DELIVERED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "CONFIRMED"]:
                tx.status = "COMPLETED"

        tx.updated_at = datetime.utcnow()

        ev = TransactionEvent(
            transaction_id=tx.id,
            stage_label=f"Payment: {tx.payment_status.replace('_', ' ').title()}",
            description=f"Payment record updated: ₹{req.paid_amount:,.2f} recorded (Ref: {tx.payment_reference or 'N/A'}). [Tracking Only]",
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(tx)
        return tx

    def select_payment_method(
        self,
        db: Session,
        transaction_id: int,
        payment_method: str,  # "RAZORPAY" or "COD"
        cod_charge: float = 0.0,
    ) -> Transaction:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        tx.payment_method = payment_method.upper()
        tx.cod_charge = cod_charge if tx.payment_method == "COD" else 0.0
        
        base_amt = (tx.final_price or 0.0) * (tx.quantity_kg or 0.0)
        tx.total_amount = round(base_amt + tx.cod_charge, 2)
        tx.expected_amount = tx.total_amount

        if tx.payment_method == "COD":
            tx.payment_status = "PENDING"
            desc = f"Payment method selected: Cash on Delivery (COD). Base amount: ₹{base_amt:,.2f}, COD charge: ₹{tx.cod_charge:,.2f}, Total payable: ₹{tx.total_amount:,.2f}."
        else:
            desc = f"Payment method selected: Razorpay Online Payment. Total payable: ₹{tx.total_amount:,.2f}."

        ev = TransactionEvent(
            transaction_id=tx.id,
            stage_label=f"Payment Method: {tx.payment_method}",
            description=desc,
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(tx)
        return tx

    def create_dispute(
        self,
        db: Session,
        transaction_id: int,
        req: DisputeCreateRequest,
    ) -> Dispute:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        dispute = Dispute(
            transaction_id=transaction_id,
            raised_by_role=req.raised_by_role,
            raised_by_id=req.raised_by_id or tx.farmer_id,
            category=req.category,
            description=req.description,
            status="OPEN",
            created_at=datetime.utcnow(),
        )
        db.add(dispute)
        
        tx.status = "DISPUTED"
        tx.updated_at = datetime.utcnow()

        ev = TransactionEvent(
            transaction_id=transaction_id,
            stage_label=f"Dispute Raised ({req.category.title()})",
            description=f"Grievance filed: {req.description[:80]}...",
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(dispute)
        return dispute

    def resolve_dispute(
        self,
        db: Session,
        dispute_id: int,
        req: DisputeResolveRequest,
    ) -> Dispute:
        dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute with ID {dispute_id} not found"
            )

        dispute.status = req.status
        dispute.resolution_notes = req.resolution_notes
        if req.status in ["RESOLVED", "REJECTED"]:
            dispute.resolved_at = datetime.utcnow()

        tx = db.query(Transaction).filter(Transaction.id == dispute.transaction_id).first()
        if tx and req.status == "RESOLVED":
            tx.status = "COMPLETED"
            tx.updated_at = datetime.utcnow()

        ev = TransactionEvent(
            transaction_id=dispute.transaction_id,
            stage_label=f"Dispute {req.status.title()}",
            description=f"Resolution: {req.resolution_notes}",
            done=True,
        )
        db.add(ev)
        db.commit()
        db.refresh(dispute)
        return dispute

    def get_transaction_detail(
        self,
        db: Session,
        transaction_id: int,
    ) -> TransactionDetailResponse:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )

        buyer = db.query(Buyer).filter(Buyer.id == tx.buyer_id).first() if tx.buyer_id else None
        lot = db.query(Lot).filter(Lot.id == tx.lot_id).first() if tx.lot_id else None
        crop = db.query(Crop).filter(Crop.id == lot.crop_id).first() if lot and lot.crop_id else None

        events = (
            db.query(TransactionEvent)
            .filter(TransactionEvent.transaction_id == transaction_id)
            .order_by(TransactionEvent.created_at.asc())
            .all()
        )
        disputes = (
            db.query(Dispute)
            .filter(Dispute.transaction_id == transaction_id)
            .order_by(Dispute.created_at.desc())
            .all()
        )

        return TransactionDetailResponse(
            id=tx.id,
            lot_id=tx.lot_id,
            farmer_id=tx.farmer_id,
            buyer_id=tx.buyer_id,
            buyer_name=buyer.name if buyer else "Procuring Buyer",
            buyer_organization=buyer.organization if buyer else None,
            crop_name=crop.crop_name if crop else "Produce",
            quantity_kg=tx.quantity_kg or (lot.quantity if lot else 1000.0),
            final_price=tx.final_price,
            total_amount=tx.total_amount or (tx.final_price * (tx.quantity_kg or 1000.0)),
            status=tx.status,
            logistics_status=tx.logistics_status or "NOT_SCHEDULED",
            pickup_date=tx.pickup_date,
            pickup_location=tx.pickup_location,
            delivery_location=tx.delivery_location,
            transport_cost_actual=tx.transport_cost_actual,
            payment_status=tx.payment_status or "PENDING",
            expected_amount=tx.expected_amount or tx.total_amount,
            paid_amount=tx.paid_amount or 0.0,
            payment_date=tx.payment_date,
            payment_reference=tx.payment_reference,
            created_at=tx.created_at,
            updated_at=tx.updated_at,
            events=[TransactionEventResponse.model_validate(e) for e in events],
            disputes=[DisputeResponse.model_validate(d) for d in disputes],
        )


transaction_service = TransactionService()
