from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Farmer
from app.schemas.auth import LoginRequest, LoginResponse, Token
from app.schemas.farmer import FarmerResponse
import hashlib

router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Mock/Development Authentication Endpoint.
    Authenticates by phone number and returns the farmer profile + token.
    """
    farmer = db.query(Farmer).filter(Farmer.phone == login_data.phone).first()
    if not farmer:
        # If farmer does not exist in dev mode, create default
        farmer = Farmer(
            name="Ramesh Kumar",
            phone=login_data.phone,
            state="Maharashtra",
            district="Nashik",
            village="Dindori",
            preferred_language="en",
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

    return LoginResponse(
        access_token=f"kissan_dev_token_{farmer.id}",
        token_type="bearer",
        farmer=FarmerResponse.model_validate(farmer),
    )


@router.get("/me", response_model=FarmerResponse)
def get_current_farmer(farmer_id: int = 1, db: Session = Depends(get_db)):
    """
    Returns the currently active farmer profile (defaults to demo farmer ID 1).
    """
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer not found")
    return farmer
