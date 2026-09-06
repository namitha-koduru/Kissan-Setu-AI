from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class BuyerBase(BaseModel):
    name: str
    organization: Optional[str] = None
    location: str
    phone: Optional[str] = None
    email: Optional[str] = None
    verified: Optional[bool] = False
    verification_status: Optional[str] = "UNVERIFIED"
    rating: Optional[float] = 4.5
    preferred_crops: Optional[List[str]] = None
    min_quantity_qtl: Optional[float] = None
    max_quantity_qtl: Optional[float] = None
    preferred_quality: Optional[str] = "Grade A"
    indicative_price_per_kg: Optional[float] = None
    payment_reliability_score: Optional[float] = 90.0
    procurement_radius_km: Optional[float] = 100.0
    business_type: Optional[str] = "Enterprise Buyer"


class BuyerCreate(BuyerBase):
    pass


class BuyerResponse(BuyerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
