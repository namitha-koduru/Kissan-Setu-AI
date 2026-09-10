from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import InventoryItem, StockAdjustment, Farmer, Crop, Lot


class InventoryService:
    """
    Authoritative Stock & Inventory Engine for Farmers and FPOs.
    Controls stock levels, guarantees exact availability, records offline sales,
    and enforces idempotent inventory transitions across the marketplace lifecycle.
    """

    def get_or_create_inventory(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        initial_quantity: float = 0.0,
        variety: Optional[str] = None,
        unit: str = "kg",
        location: Optional[str] = None
    ) -> InventoryItem:
        """Finds existing inventory item for farmer/FPO and crop, or creates one initialized from crop records."""
        item = (
            db.query(InventoryItem)
            .filter(
                InventoryItem.farmer_id == farmer_id,
                InventoryItem.crop_name.ilike(crop_name.strip())
            )
            .first()
        )
        if item:
            return item

        # If not yet tracked, find from Crop table or initialize
        crop = db.query(Crop).filter(Crop.farmer_id == farmer_id, Crop.crop_name.ilike(crop_name.strip())).first()
        qty = initial_quantity if initial_quantity > 0 else (crop.quantity if crop else 0.0)
        
        # Get farmer/FPO location fallback
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        loc = location or (crop.farmer.district if crop and crop.farmer else (farmer.district if farmer else "Nashik, Maharashtra"))

        item = InventoryItem(
            farmer_id=farmer_id,
            crop_name=crop_name.strip(),
            variety=variety or (crop.variety if crop else "Standard Grade"),
            total_quantity=qty,
            allocated_quantity=0.0,
            reserved_quantity=0.0,
            sold_quantity=0.0,
            unit=unit,
            location=loc,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(item)
        db.flush()

        # Record initial baseline adjustment
        if qty > 0:
            adj = StockAdjustment(
                inventory_id=item.id,
                farmer_id=farmer_id,
                crop_name=item.crop_name,
                adjustment_type="INITIAL_BASELINE",
                quantity=qty,
                unit=unit,
                notes=f"Initial harvest baseline registered for {item.crop_name}.",
                created_at=datetime.utcnow(),
            )
            db.add(adj)
        db.commit()
        db.refresh(item)
        return item

    def get_farmer_inventory_summary(self, db: Session, farmer_id: int) -> Dict[str, Any]:
        """Calculates total aggregated inventory metrics and items breakdown."""
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        is_fpo = farmer and farmer.role == "fpo"
        # Ensure items exist for any crops the farmer registered (only for individual farmers)
        if not is_fpo:
            crops = db.query(Crop).filter(Crop.farmer_id == farmer_id).all()
            for c in crops:
                self.get_or_create_inventory(
                    db=db,
                    farmer_id=farmer_id,
                    crop_name=c.crop_name,
                    initial_quantity=c.quantity,
                    variety=c.variety
                )

        items = db.query(InventoryItem).filter(InventoryItem.farmer_id == farmer_id).all()

        total_stock = sum(i.total_quantity for i in items)
        active_lots = sum(i.allocated_quantity for i in items)
        reserved = sum(i.reserved_quantity for i in items)
        sold = sum(i.sold_quantity for i in items)
        available = sum(i.available_quantity for i in items)

        items_data = [
            {
                "id": i.id,
                "crop_name": i.crop_name,
                "variety": i.variety,
                "total_quantity": i.total_quantity,
                "allocated_quantity": i.allocated_quantity,
                "reserved_quantity": i.reserved_quantity,
                "sold_quantity": i.sold_quantity,
                "available_quantity": i.available_quantity,
                "unit": i.unit,
                "quality_grade": i.quality_grade,
                "location": i.location,
                "updated_at": i.updated_at,
            }
            for i in items
        ]

        return {
            "farmer_id": farmer_id,
            "total_stock": round(total_stock, 2),
            "available_to_sell": round(available, 2),
            "in_active_lots": round(active_lots, 2),
            "reserved": round(reserved, 2),
            "sold": round(sold, 2),
            "items_count": len(items),
            "items": items_data,
        }

    def record_offline_sale(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        unit: str = "kg",
        customer_name: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Deducts stock for offline direct sale with strict inventory validation."""
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")

        item = self.get_or_create_inventory(db, farmer_id, crop_name)

        if item.available_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {item.available_quantity} {item.unit} of {crop_name} is currently available to sell."
            )

        item.sold_quantity = round(item.sold_quantity + quantity, 2)
        item.updated_at = datetime.utcnow()

        adj = StockAdjustment(
            inventory_id=item.id,
            farmer_id=farmer_id,
            crop_name=item.crop_name,
            adjustment_type="OFFLINE_SALE",
            quantity=-abs(quantity),
            unit=unit,
            customer_name=customer_name,
            notes=notes or f"Direct offline sale to {customer_name or 'local customer'}.",
            created_at=datetime.utcnow(),
        )
        db.add(adj)
        db.commit()
        db.refresh(item)

        return {
            "success": True,
            "message": f"Recorded offline sale of {quantity} {unit} of {crop_name}.",
            "new_available_quantity": item.available_quantity,
            "sold_quantity": item.sold_quantity,
        }

    def record_member_aggregation(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        member_name: Optional[str] = None,
        variety: Optional[str] = None,
        unit: str = "kg",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """FPO pools produce from a smallholder member farmer, increasing total available stock."""
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")

        item = self.get_or_create_inventory(db, farmer_id, crop_name, initial_quantity=0.0, variety=variety, unit=unit)
        item.total_quantity = round(item.total_quantity + quantity, 2)
        item.updated_at = datetime.utcnow()

        adj = StockAdjustment(
            inventory_id=item.id,
            farmer_id=farmer_id,
            crop_name=item.crop_name,
            adjustment_type="MEMBER_AGGREGATION",
            quantity=abs(quantity),
            unit=unit,
            customer_name=member_name,
            notes=notes or f"Aggregated {quantity} {unit} from member {member_name or 'farmer'}.",
            created_at=datetime.utcnow(),
        )
        db.add(adj)
        db.commit()
        db.refresh(item)

        return {
            "success": True,
            "message": f"Aggregated {quantity} {unit} from member {member_name or 'farmer'}.",
            "new_total_quantity": item.total_quantity,
            "new_available_quantity": item.available_quantity,
        }

    def allocate_to_lot(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        lot_id: Optional[int] = None
    ) -> None:
        """Validates and allocates stock to an open harvest lot."""
        item = self.get_or_create_inventory(db, farmer_id, crop_name)
        if item.available_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {item.available_quantity} {item.unit} of {crop_name} is currently available to sell. Cannot list {quantity} {item.unit}."
            )

        item.allocated_quantity = round(item.allocated_quantity + quantity, 2)
        item.updated_at = datetime.utcnow()

        adj = StockAdjustment(
            inventory_id=item.id,
            farmer_id=farmer_id,
            crop_name=item.crop_name,
            adjustment_type="LOT_ALLOCATION",
            quantity=-abs(quantity),
            unit=item.unit,
            lot_id=lot_id,
            notes=f"Allocated {quantity} {item.unit} to active Lot #{lot_id or 'TBD'}.",
            created_at=datetime.utcnow(),
        )
        db.add(adj)

    def release_from_lot(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        lot_id: Optional[int] = None
    ) -> None:
        """Releases stock from a cancelled or expired lot back to available stock."""
        item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike(crop_name))
            .first()
        )
        if item:
            item.allocated_quantity = max(0.0, round(item.allocated_quantity - quantity, 2))
            item.updated_at = datetime.utcnow()

            adj = StockAdjustment(
                inventory_id=item.id,
                farmer_id=farmer_id,
                crop_name=item.crop_name,
                adjustment_type="LOT_RELEASE",
                quantity=abs(quantity),
                unit=item.unit,
                lot_id=lot_id,
                notes=f"Released {quantity} {item.unit} from cancelled/expired Lot #{lot_id or 'TBD'}.",
                created_at=datetime.utcnow(),
            )
            db.add(adj)

    def release_from_order(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        transaction_id: Optional[int] = None
    ) -> None:
        """Releases reserved stock from a cancelled order back to available stock."""
        item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike(crop_name))
            .first()
        )
        if item:
            if item.reserved_quantity >= quantity:
                item.reserved_quantity = max(0.0, round(item.reserved_quantity - quantity, 2))
            else:
                remaining = round(quantity - item.reserved_quantity, 2)
                item.reserved_quantity = 0.0
                item.allocated_quantity = max(0.0, round(item.allocated_quantity - remaining, 2))
            
            item.updated_at = datetime.utcnow()

            adj = StockAdjustment(
                inventory_id=item.id,
                farmer_id=farmer_id,
                crop_name=item.crop_name,
                adjustment_type="ORDER_CANCELLED",
                quantity=abs(quantity),
                unit=item.unit,
                transaction_id=transaction_id,
                notes=f"Released {quantity} {item.unit} from cancelled Order #{transaction_id or 'TBD'}.",
                created_at=datetime.utcnow(),
            )
            db.add(adj)

    def reserve_for_order(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        transaction_id: Optional[int] = None
    ) -> None:
        """Moves quantity from allocated to reserved upon offer acceptance."""
        item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike(crop_name))
            .first()
        )
        if item:
            item.allocated_quantity = max(0.0, round(item.allocated_quantity - quantity, 2))
            item.reserved_quantity = round(item.reserved_quantity + quantity, 2)
            item.updated_at = datetime.utcnow()

            adj = StockAdjustment(
                inventory_id=item.id,
                farmer_id=farmer_id,
                crop_name=item.crop_name,
                adjustment_type="ORDER_RESERVED",
                quantity=0.0,
                unit=item.unit,
                transaction_id=transaction_id,
                notes=f"Reserved {quantity} {item.unit} for confirmed Trade #{transaction_id or 'TBD'}.",
                created_at=datetime.utcnow(),
            )
            db.add(adj)

    def complete_order_sale(
        self,
        db: Session,
        farmer_id: int,
        crop_name: str,
        quantity: float,
        transaction_id: Optional[int] = None
    ) -> None:
        """Finalizes sale: converts reserved stock into permanently sold stock."""
        item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike(crop_name))
            .first()
        )
        if item:
            item.reserved_quantity = max(0.0, round(item.reserved_quantity - quantity, 2))
            item.sold_quantity = round(item.sold_quantity + quantity, 2)
            item.updated_at = datetime.utcnow()

            adj = StockAdjustment(
                inventory_id=item.id,
                farmer_id=farmer_id,
                crop_name=item.crop_name,
                adjustment_type="ORDER_COMPLETED",
                quantity=-abs(quantity),
                unit=item.unit,
                transaction_id=transaction_id,
                notes=f"Completed trade #{transaction_id or 'TBD'} and confirmed delivery of {quantity} {item.unit}.",
                created_at=datetime.utcnow(),
            )
            db.add(adj)

    def get_stock_audit_history(self, db: Session, farmer_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns chronological immutable audit history of all inventory adjustments."""
        records = (
            db.query(StockAdjustment)
            .filter(StockAdjustment.farmer_id == farmer_id)
            .order_by(StockAdjustment.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": r.id,
                "crop_name": r.crop_name,
                "adjustment_type": r.adjustment_type,
                "quantity": r.quantity,
                "unit": r.unit,
                "customer_name": r.customer_name,
                "lot_id": r.lot_id,
                "transaction_id": r.transaction_id,
                "notes": r.notes,
                "created_at": r.created_at,
            }
            for r in records
        ]


inventory_service = InventoryService()
