from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class OfferBase(BaseModel):
    lot_id: int
    buyer_id: int
    offered_price: float
    status: Optional[str] = "Pending"


class OfferCreate(OfferBase):
    pass


class OfferStatusUpdate(BaseModel):
    status: str  # Accepted, Rejected, Countered, Pending


class OfferResponse(OfferBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
