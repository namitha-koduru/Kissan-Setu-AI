from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.farmer import FarmerResponse


class LoginRequest(BaseModel):
    phone: Optional[str] = None
    username_or_phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "farmer"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse
