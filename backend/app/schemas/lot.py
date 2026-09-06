from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LotBase(BaseModel):
    quantity: float
    asking_price: float
    quality: Optional[str] = "Grade A"
    harvest_date: Optional[str] = None
    location: Optional[str] = "Nashik, Maharashtra"
    status: Optional[str] = "Open for Offers"


class LotCreate(LotBase):
    farmer_id: int
    crop_id: int
    buyer_id: Optional[int] = None


class LotUpdate(BaseModel):
    quantity: Optional[float] = None
    asking_price: Optional[float] = None
    quality: Optional[str] = None
    status: Optional[str] = None
    buyer_id: Optional[int] = None


class LotResponse(LotBase):
    id: int
    farmer_id: int
    crop_id: int
    buyer_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
