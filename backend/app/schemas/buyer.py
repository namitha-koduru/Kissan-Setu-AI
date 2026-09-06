from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BuyerBase(BaseModel):
    name: str
    organization: Optional[str] = None
    location: str
    phone: Optional[str] = None
    email: Optional[str] = None
    verified: Optional[bool] = False
    rating: Optional[float] = 4.5


class BuyerCreate(BuyerBase):
    pass


class BuyerResponse(BuyerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
