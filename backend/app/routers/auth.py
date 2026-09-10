from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Farmer
from app.schemas.auth import LoginRequest, LoginResponse, Token
from app.schemas.farmer import FarmerResponse
from app.services.auth_validation import check_mobile_exists, check_email_exists, normalize_mobile, normalize_email
import hashlib

router = APIRouter(prefix="/auth", tags=["Authentication"])


class CheckUniqueRequest(BaseModel):
    mobile: Optional[str] = None
    email: Optional[str] = None


@router.post("/check-unique")
def check_unique(payload: CheckUniqueRequest, db: Session = Depends(get_db)):
    """
    Pre-registration endpoint to verify mobile number and email uniqueness across all roles.
    """
    if payload.mobile and check_mobile_exists(db, payload.mobile):
        return {
            "available": False,
            "field": "mobile",
            "message": "This mobile number is already registered. Please log in or use a different number."
        }
    if payload.email and check_email_exists(db, payload.email):
        return {
            "available": False,
            "field": "email",
            "message": "This email is already registered. Please log in or use a different email."
        }
    return {"available": True}


from app.database.models import Farmer, Buyer
from app.schemas.buyer import BuyerResponse


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authentication Endpoint.
    Authenticates by normalized phone number or email and returns profile + token with authoritative role.
    """
    raw_ident = login_data.phone or login_data.username_or_phone or ""
    norm_phone = normalize_mobile(raw_ident)
    req_role = (login_data.role or "").lower()

    # 1. If buyer role is explicitly requested, search Buyer table first
    if req_role == "buyer":
        buyer = None
        if norm_phone and len(norm_phone) == 10:
            buyer = db.query(Buyer).filter(
                (Buyer.phone == norm_phone) |
                (Buyer.phone == f"+91{norm_phone}") |
                (Buyer.phone == f"91{norm_phone}") |
                (Buyer.phone == raw_ident)
            ).first()
        elif "@" in raw_ident:
            buyer = db.query(Buyer).filter(Buyer.email.ilike(raw_ident.strip().lower())).first()
        else:
            buyer = db.query(Buyer).filter(Buyer.phone == raw_ident).first()

        if buyer:
            return LoginResponse(
                access_token=f"kissan_buyer_token_{buyer.id}",
                token_type="bearer",
                role="buyer",
                user_id=buyer.id,
                buyer=BuyerResponse.model_validate(buyer),
            )

    # 2. Search Farmer table (covers farmer and fpo roles)
    farmer = None
    if norm_phone and len(norm_phone) == 10:
        farmer = db.query(Farmer).filter(
            (Farmer.phone == norm_phone) |
            (Farmer.phone == f"+91{norm_phone}") |
            (Farmer.phone == f"91{norm_phone}") |
            (Farmer.phone == raw_ident)
        ).first()
    elif "@" in raw_ident:
        clean_email = raw_ident.strip().lower()
        farmer = db.query(Farmer).filter(Farmer.email.ilike(clean_email)).first()
    else:
        farmer = db.query(Farmer).filter(Farmer.phone == raw_ident).first()

    if farmer:
        user_role = farmer.role or "farmer"
        return LoginResponse(
            access_token=f"kissan_dev_token_{farmer.id}",
            token_type="bearer",
            role=user_role,
            user_id=farmer.id,
            farmer=FarmerResponse.model_validate(farmer),
        )

    # 3. Check Buyer table if not already checked
    if req_role != "buyer":
        buyer = None
        if norm_phone and len(norm_phone) == 10:
            buyer = db.query(Buyer).filter(
                (Buyer.phone == norm_phone) |
                (Buyer.phone == f"+91{norm_phone}") |
                (Buyer.phone == f"91{norm_phone}") |
                (Buyer.phone == raw_ident)
            ).first()
        elif "@" in raw_ident:
            buyer = db.query(Buyer).filter(Buyer.email.ilike(raw_ident.strip().lower())).first()
        else:
            buyer = db.query(Buyer).filter(Buyer.phone == raw_ident).first()

        if buyer:
            return LoginResponse(
                access_token=f"kissan_buyer_token_{buyer.id}",
                token_type="bearer",
                role="buyer",
                user_id=buyer.id,
                buyer=BuyerResponse.model_validate(buyer),
            )

    # 4. If neither exists, create according to requested role
    clean_phone = norm_phone if (norm_phone and len(norm_phone) == 10) else raw_ident
    if req_role == "buyer":
        new_buyer = Buyer(
            name="Registered Institutional Buyer",
            phone=clean_phone or "9848022338",
            location="Nashik, Maharashtra",
            business_type="Enterprise Buyer",
            verification_status="UNVERIFIED",
            verified=False,
        )
        db.add(new_buyer)
        db.commit()
        db.refresh(new_buyer)
        return LoginResponse(
            access_token=f"kissan_buyer_token_{new_buyer.id}",
            token_type="bearer",
            role="buyer",
            user_id=new_buyer.id,
            buyer=BuyerResponse.model_validate(new_buyer),
        )

    # Default to Farmer or FPO
    assigned_role = "fpo" if req_role == "fpo" else "farmer"
    farmer = Farmer(
        name="Registered Producer" if assigned_role == "farmer" else "Registered FPO",
        phone=clean_phone or "9848022338",
        state="Maharashtra",
        district="Nashik",
        village="Dindori",
        preferred_language="en",
        role=assigned_role,
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    return LoginResponse(
        access_token=f"kissan_dev_token_{farmer.id}",
        token_type="bearer",
        role=assigned_role,
        user_id=farmer.id,
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
