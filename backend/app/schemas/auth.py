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
    entity_id: Optional[int] = None
    farmer_id: Optional[int] = None
    fpo_id: Optional[int] = None
    buyer_id: Optional[int] = None
    farmer: Optional[FarmerResponse] = None
    buyer: Optional[BuyerResponse] = None


class MeResponse(BaseModel):
    user_id: int
    role: str
    entity_id: int
    farmer_id: Optional[int] = None
    fpo_id: Optional[int] = None
    buyer_id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    organization_name: Optional[str] = None
    farmer: Optional[FarmerResponse] = None
    buyer: Optional[BuyerResponse] = None

