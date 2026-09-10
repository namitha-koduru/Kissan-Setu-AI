from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LotBase(BaseModel):
    quantity: float
    unit: Optional[str] = "kg"
    asking_price: float
    quality: Optional[str] = "Grade A"
    quality_description: Optional[str] = None
    harvest_date: Optional[str] = None
    harvest_window: Optional[str] = None
    location: Optional[str] = "Nashik, Maharashtra"
    status: Optional[str] = "Open for Offers"
    image_id: Optional[str] = None
    preferred_buyer_id: Optional[int] = None


class LotCreate(LotBase):
    farmer_id: int
    crop_id: int
    buyer_id: Optional[int] = None


class LotUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    asking_price: Optional[float] = None
    quality: Optional[str] = None
    quality_description: Optional[str] = None
    harvest_date: Optional[str] = None
    harvest_window: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    buyer_id: Optional[int] = None
    image_id: Optional[str] = None
    preferred_buyer_id: Optional[int] = None


class LotResponse(LotBase):
    id: int
    farmer_id: int
    crop_id: int
    buyer_id: Optional[int] = None
    farmer_name: Optional[str] = None
    farmer_role: Optional[str] = "Farmer"
    crop_name: Optional[str] = None
    crop_variety: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
