from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MarketPriceBase(BaseModel):
    crop_name: str
    price: float
    unit: Optional[str] = "kg"
    date: str


class MarketPriceCreate(MarketPriceBase):
    pass


class MarketPriceResponse(MarketPriceBase):
    id: int
    market_id: int
    model_config = ConfigDict(from_attributes=True)


class MarketBase(BaseModel):
    name: str
    district: str
    state: Optional[str] = "Maharashtra"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MarketCreate(MarketBase):
    pass


class MarketResponse(MarketBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MarketDetailResponse(MarketResponse):
    prices: List[MarketPriceResponse] = []
    model_config = ConfigDict(from_attributes=True)
