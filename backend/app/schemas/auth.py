from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.farmer import FarmerResponse


class LoginRequest(BaseModel):
    phone: Optional[str] = "+91 98765 43210"
    username_or_phone: Optional[str] = None
    password: Optional[str] = "demo123"
    role: Optional[str] = "farmer"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse
