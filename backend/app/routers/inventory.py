from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.inventory_service import inventory_service

router = APIRouter(prefix="/inventory", tags=["Stock & Inventory"])


class OfflineSaleRequest(BaseModel):
    farmer_id: Optional[int] = 1
    crop_name: str
    quantity: float
    unit: Optional[str] = "kg"
    customer_name: Optional[str] = None
    notes: Optional[str] = None


class AggregationRequest(BaseModel):
    fpo_id: Optional[int] = 1
    crop_name: str
    quantity: float
    member_name: Optional[str] = None
    variety: Optional[str] = None
    unit: Optional[str] = "kg"
    notes: Optional[str] = None


@router.get("/summary")
@router.get("/farmer/{farmer_id}")
@router.get("/{farmer_id}/summary")
def get_inventory_summary(farmer_id: int = 1, db: Session = Depends(get_db)):
    """
    Fetches real stock breakdown: Total Stock, Available to Sell, In Active Lots, Reserved, and Sold.
    """
    return inventory_service.get_farmer_inventory_summary(db=db, farmer_id=farmer_id)


@router.post("/offline-sale")
def record_offline_sale(req: OfflineSaleRequest, db: Session = Depends(get_db)):
    """
    Records a manual offline sale, checks available stock, deducts inventory, and writes audit record.
    """
    return inventory_service.record_offline_sale(
        db=db,
        farmer_id=req.farmer_id or 1,
        crop_name=req.crop_name,
        quantity=req.quantity,
        unit=req.unit or "kg",
        customer_name=req.customer_name,
        notes=req.notes,
    )


@router.post("/aggregation")
def record_fpo_aggregation(
    req: AggregationRequest,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    """
    FPO pools produce from member farmers, increasing available aggregated inventory in PostgreSQL.
    """
    if x_user_role and x_user_role.lower() in ["buyer", "farmer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only FPO accounts can aggregate member produce into pooled stock."
        )

    return inventory_service.record_member_aggregation(
        db=db,
        farmer_id=req.fpo_id or 1,
        crop_name=req.crop_name,
        quantity=req.quantity,
        member_name=req.member_name,
        variety=req.variety,
        unit=req.unit or "kg",
        notes=req.notes,
    )


@router.get("/audit-history")
@router.get("/farmer/{farmer_id}/audit")
@router.get("/{farmer_id}/audit")
def get_inventory_audit(farmer_id: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves complete chronological audit history of stock adjustments.
    """
    return inventory_service.get_stock_audit_history(db=db, farmer_id=farmer_id, limit=limit)
