from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import Offer, Lot, Buyer, MarketPrice, Crop
from app.schemas.buyer_matching import (
    OfferIntelligenceResponse,
    OfferHistoryItem,
    CounterOfferRequest,
)


class OfferIntelligenceService:
    """
    Offer Intelligence and Negotiation Service.
    Calculates offer vs Mandi benchmarks, net realization trade-offs, and provides
    transparent AI-assisted counter ranges with immutable negotiation history.
    """

    def get_offer_intelligence(self, db: Session, offer_id: int) -> OfferIntelligenceResponse:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Offer with ID {offer_id} not found"
            )

        lot = db.query(Lot).filter(Lot.id == offer.lot_id).first()
        buyer = db.query(Buyer).filter(Buyer.id == offer.buyer_id).first()
        crop = db.query(Crop).filter(Crop.id == lot.crop_id).first() if lot else None

        crop_name = crop.crop_name if crop else "Tomato"
        quantity_kg = offer.quantity_kg or (lot.quantity if lot else 2000.0)
        quantity_qtl = quantity_kg / 100.0

        # Mandi benchmark
        latest_price = (
            db.query(MarketPrice)
            .filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
            .order_by(MarketPrice.date.desc())
            .first()
        )
        mandi_benchmark = float(latest_price.modal_price or latest_price.price) if latest_price else 27.50

        offered_price = offer.offered_price
        price_premium = round(offered_price - mandi_benchmark, 2)

        # Net Realization Direct Sale (subsidized collection, 0% cess)
        direct_transport = round(quantity_qtl * 2.2 * 25.0, 2)
        direct_net_total = round((quantity_kg * offered_price) - direct_transport, 2)

        # Net Realization Mandi Sale (35km freight, 1.5% cess, ₹18/qtl handling)
        mandi_gross = quantity_kg * mandi_benchmark
        mandi_transport = round(quantity_qtl * 3.5 * 35.0, 2)
        mandi_fees = round((mandi_gross * 0.015) + (quantity_qtl * 18.0), 2)
        mandi_net_total = round(mandi_gross - mandi_transport - mandi_fees, 2)

        net_advantage = round(direct_net_total - mandi_net_total, 2)

        # Relative Attractiveness
        if price_premium >= 1.0 or net_advantage > 2000.0:
            attractiveness = "Highly Attractive"
        elif price_premium >= 0.0 or net_advantage >= 0.0:
            attractiveness = "Competitive"
        else:
            attractiveness = "Below Mandi Benchmark"

        # AI-Assisted Counter Range Suggestion
        asking_price = lot.asking_price if lot else (offered_price + 2.0)
        suggested_min = round(max(offered_price + 0.5, mandi_benchmark + 0.5), 2)
        suggested_max = round(max(suggested_min + 1.0, asking_price), 2)

        if price_premium >= 1.5:
            negotiation_tip = f"Offer is ₹{price_premium:.2f}/kg above mandi benchmark. You may accept directly or counter closer to your asking price (₹{asking_price:.2f}/kg)."
        elif price_premium >= 0:
            negotiation_tip = f"Offer matches mandi price. Countering between ₹{suggested_min:.2f}–₹{suggested_max:.2f}/kg can yield higher returns without deterring the buyer."
        else:
            negotiation_tip = f"Offer is ₹{abs(price_premium):.2f}/kg below current mandi rate. Countering with at least ₹{suggested_min:.2f}/kg is recommended."

        # Buyer Verification & Rating
        is_verified = buyer.verified or (buyer.verification_status == "VERIFIED") if buyer else False
        v_status = buyer.verification_status if buyer else "UNVERIFIED"
        buyer_name = buyer.name if buyer else "Enterprise Buyer"
        buyer_org = buyer.organization if buyer else None

        # Build history thread
        history = self.get_offer_history(db, offer_id)

        # Match Score
        match_score = int(min(98, max(50, 70 + int(price_premium * 8) + (10 if is_verified else 0))))

        return OfferIntelligenceResponse(
            offer_id=offer.id,
            lot_id=offer.lot_id,
            buyer_id=offer.buyer_id,
            buyer_name=buyer_name,
            organization=buyer_org,
            is_verified=is_verified,
            verification_status=v_status,
            offered_price=offered_price,
            mandi_benchmark_price=mandi_benchmark,
            price_premium_per_kg=price_premium,
            quantity_kg=quantity_kg,
            estimated_net_realization_total=direct_net_total,
            mandi_net_realization_total=mandi_net_total,
            net_advantage_total=net_advantage,
            match_score=match_score,
            relative_attractiveness=attractiveness,
            suggested_counter_min=suggested_min,
            suggested_counter_max=suggested_max,
            negotiation_tip=negotiation_tip,
            history=history,
        )

    def counter_offer(
        self,
        db: Session,
        offer_id: int,
        counter_data: CounterOfferRequest,
    ) -> Offer:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Offer with ID {offer_id} not found"
            )

        if offer.status in ["Accepted", "Rejected", "Expired"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot counter offer in '{offer.status}' state"
            )

        # Update offer with counter price and status
        offer.counter_price = counter_data.counter_price
        if counter_data.quantity_kg:
            offer.quantity_kg = counter_data.quantity_kg
        if counter_data.message:
            offer.message = f"{offer.message or ''}\n[Farmer Counter]: {counter_data.message}".strip()
        offer.status = "Countered"
        offer.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(offer)
        return offer

    def get_offer_history(self, db: Session, offer_id: int) -> List[OfferHistoryItem]:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            return []

        # Find root offer and all chained offers
        items: List[OfferHistoryItem] = []
        
        # Original offer
        items.append(
            OfferHistoryItem(
                id=offer.id,
                offered_price=offer.offered_price,
                counter_price=None,
                quantity_kg=offer.quantity_kg,
                sender_role="Buyer",
                status="Initial Offer",
                message=offer.message,
                created_at=offer.created_at,
            )
        )

        # If countered, append counter step
        if offer.counter_price:
            items.append(
                OfferHistoryItem(
                    id=offer.id,
                    offered_price=offer.offered_price,
                    counter_price=offer.counter_price,
                    quantity_kg=offer.quantity_kg,
                    sender_role="Farmer",
                    status="Counter Offer",
                    message=f"Countered at ₹{offer.counter_price:.2f}/kg",
                    created_at=offer.updated_at or offer.created_at,
                )
            )

        return items


offer_intelligence_service = OfferIntelligenceService()
