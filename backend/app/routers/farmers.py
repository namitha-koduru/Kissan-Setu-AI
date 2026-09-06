from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Farmer
from app.schemas.farmer import FarmerCreate, FarmerUpdate, FarmerResponse

router = APIRouter(prefix="/farmers", tags=["Farmers"])


@router.get("/", response_model=List[FarmerResponse])
def get_all_farmers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Farmer).offset(skip).limit(limit).all()


@router.get("/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {farmer_id} not found"
        )
    return farmer


@router.post("/", response_model=FarmerResponse, status_code=status.HTTP_201_CREATED)
def create_farmer(farmer_in: FarmerCreate, db: Session = Depends(get_db)):
    existing = db.query(Farmer).filter(Farmer.phone == farmer_in.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Farmer with phone {farmer_in.phone} already exists"
        )
    
    farmer_data = farmer_in.model_dump()
    farmer = Farmer(**farmer_data)
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer


@router.put("/{farmer_id}", response_model=FarmerResponse)
def update_farmer(farmer_id: int, farmer_in: FarmerUpdate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {farmer_id} not found"
        )
    
    update_data = farmer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farmer, field, value)
    
    db.commit()
    db.refresh(farmer)
    return farmer
