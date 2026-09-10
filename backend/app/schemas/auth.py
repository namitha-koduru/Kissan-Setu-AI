from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.schemas.farmer import FarmerResponse
from app.schemas.buyer import BuyerResponse


class LoginRequest(BaseModel):
    phone: Optional[str] = None
    username_or_phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "farmer"
    user_id: int
    farmer: Optional[FarmerResponse] = None
    buyer: Optional[BuyerResponse] = None
