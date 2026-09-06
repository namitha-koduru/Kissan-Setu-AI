from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import SoilProfile, Farmer
from app.schemas.soil import (
    SoilProfileCreate,
    SoilProfileUpdate,
    SoilProfileResponse,
    SoilInterpretationResponse,
)
from app.services.soil_service import soil_service

router = APIRouter(prefix="/soil", tags=["Soil Intelligence"])


@router.get("", response_model=SoilInterpretationResponse)
@router.get("/", response_model=SoilInterpretationResponse)
def get_farmer_soil_interpretation(
    farmer_id: int = Query(1, description="Target Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Get structured soil profile and agronomic interpretation for a farmer.
    Returns observations, nutrient classifications, pH status, and recommendations.
    """
    profile = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    return soil_service.interpret_soil(profile)


@router.get("/{farmer_id}", response_model=SoilInterpretationResponse)
def get_soil_by_farmer_id(
    farmer_id: int,
    db: Session = Depends(get_db)
):
    """Get soil interpretation for specific farmer ID."""
    profile = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    return soil_service.interpret_soil(profile)


@router.post("", response_model=SoilInterpretationResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SoilInterpretationResponse, status_code=status.HTTP_201_CREATED)
def create_or_upsert_soil_profile(
    soil_in: SoilProfileCreate,
    db: Session = Depends(get_db)
):
    """
    Create or update soil profile for a farmer.
    Validates pH (3.0-11.0) and non-negative nutrient values.
    """
    farmer_id = soil_in.farmer_id or 1
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        # Create demo farmer if missing
        farmer = Farmer(
            id=farmer_id,
            name="Ramesh Kumar",
            phone="+91 98765 43210",
            district="Nashik",
            state="Maharashtra"
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

    existing = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    if existing:
        # Update existing
        for field, val in soil_in.model_dump(exclude_unset=True).items():
            if field != "farmer_id":
                setattr(existing, field, val)
        db.commit()
        db.refresh(existing)
        return soil_service.interpret_soil(existing)
    else:
        new_profile = SoilProfile(**soil_in.model_dump())
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return soil_service.interpret_soil(new_profile)


@router.put("", response_model=SoilInterpretationResponse)
@router.put("/", response_model=SoilInterpretationResponse)
def update_soil_profile(
    soil_in: SoilProfileUpdate,
    farmer_id: int = Query(1, description="Target Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Update specific soil parameters for a farmer.
    """
    profile = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    if not profile:
        # Auto-create if not exists
        profile = SoilProfile(farmer_id=farmer_id, **soil_in.model_dump(exclude_unset=True))
        db.add(profile)
    else:
        for field, val in soil_in.model_dump(exclude_unset=True).items():
            setattr(profile, field, val)


    db.commit()
    db.refresh(profile)
    return soil_service.interpret_soil(profile)
