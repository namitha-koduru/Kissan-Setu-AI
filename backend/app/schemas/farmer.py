from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FarmerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: Optional[str] = "en"
    state: Optional[str] = "Maharashtra"
    district: Optional[str] = "Nashik"
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmerCreate(FarmerBase):
    password: Optional[str] = None


class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_language: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmerResponse(FarmerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
