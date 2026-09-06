from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class OfferBase(BaseModel):
    lot_id: int
    buyer_id: int
    offered_price: float
    counter_price: Optional[float] = None
    quantity_kg: Optional[float] = None
    quality_grade: Optional[str] = "Grade A"
    message: Optional[str] = None
    parent_offer_id: Optional[int] = None
    status: Optional[str] = "Pending"  # Pending, Countered, Accepted, Rejected, Expired


class OfferCreate(OfferBase):
    pass


class OfferStatusUpdate(BaseModel):
    status: str  # Accepted, Rejected, Countered, Pending


class OfferResponse(OfferBase):
    id: int
    buyer_name: Optional[str] = None
    buyer_verified: Optional[bool] = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
