from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Lot, Farmer, Crop, CropImage, Buyer
from app.schemas.lot import LotCreate, LotUpdate, LotResponse

router = APIRouter(tags=["Lots"])


@router.get("/farmers/{farmer_id}/lots", response_model=List[LotResponse])
def get_farmer_lots(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {farmer_id} not found"
        )
    return db.query(Lot).filter(Lot.farmer_id == farmer_id).order_by(Lot.created_at.desc()).all()


@router.get("/lots", response_model=List[LotResponse])
def get_all_lots(
    status_filter: Optional[str] = None,
    crop_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Lot)
    if status_filter:
        query = query.filter(Lot.status == status_filter)
    if crop_id:
        query = query.filter(Lot.crop_id == crop_id)
    return query.order_by(Lot.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/lots/{lot_id}", response_model=LotResponse)
def get_lot(lot_id: int, db: Session = Depends(get_db)):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    return lot


@router.post("/lots", response_model=LotResponse, status_code=status.HTTP_201_CREATED)
def create_lot(lot_in: LotCreate, db: Session = Depends(get_db)):
    # Verify farmer exists
    farmer = db.query(Farmer).filter(Farmer.id == lot_in.farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {lot_in.farmer_id} not found"
        )
    # Verify crop exists
    crop = db.query(Crop).filter(Crop.id == lot_in.crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID {lot_in.crop_id} not found"
        )

    # If image_id is provided, verify it exists
    if lot_in.image_id:
        img = db.query(CropImage).filter(CropImage.id == lot_in.image_id).first()
        if not img:
            lot_in.image_id = None  # Graceful fallback

    lot = Lot(**lot_in.model_dump())
    db.add(lot)
    db.commit()
    db.refresh(lot)
    return lot


@router.put("/lots/{lot_id}", response_model=LotResponse)
def update_lot(lot_id: int, lot_in: LotUpdate, db: Session = Depends(get_db)):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    
    update_data = lot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lot, field, value)
    
    db.commit()
    db.refresh(lot)
    return lot
