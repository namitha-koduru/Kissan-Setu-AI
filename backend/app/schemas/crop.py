from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class CropBase(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    acreage: Optional[float] = None
    quantity: float
    sowing_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    growth_stage: Optional[str] = "Near maturity"
    soil_type: Optional[str] = None
    image_url: Optional[str] = None
    ai_observation: Optional[Any] = None


class CropCreate(CropBase):
    farmer_id: int


class CropUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    acreage: Optional[float] = None
    quantity: Optional[float] = None
    sowing_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None
    image_url: Optional[str] = None
    ai_observation: Optional[Any] = None


class CropResponse(CropBase):
    id: int
    farmer_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
