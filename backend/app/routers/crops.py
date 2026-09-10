from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Crop, Farmer, InventoryItem
from app.schemas.crop import CropCreate, CropUpdate, CropResponse

router = APIRouter(tags=["Crops"])


@router.get("/farmers/{farmer_id}/crops", response_model=List[CropResponse])
def get_farmer_crops(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {farmer_id} not found"
        )
    return db.query(Crop).filter(Crop.farmer_id == farmer_id).all()


@router.get("/crops", response_model=List[CropResponse])
@router.get("/crops/", response_model=List[CropResponse])
def get_all_crops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Crop).offset(skip).limit(limit).all()


@router.get("/crops/{crop_id}", response_model=CropResponse)
def get_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID {crop_id} not found"
        )
    return crop


@router.post("/crops", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
@router.post("/crops/", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_crop(
    crop_in: CropCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    if x_user_role and x_user_role.lower() == "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyers cannot register crops. Crop creation is reserved for Farmers and agricultural producers."
        )

    farmer = db.query(Farmer).filter(Farmer.id == crop_in.farmer_id).first()
    if not farmer and x_user_id:
        try:
            uid = int(x_user_id)
            farmer = db.query(Farmer).filter(Farmer.id == uid).first()
            if farmer:
                crop_in.farmer_id = farmer.id
        except (ValueError, TypeError):
            pass

    if not farmer and crop_in.farmer_id and crop_in.farmer_id > 1000000000:
        phone_str = str(crop_in.farmer_id)[-10:]
        farmer = db.query(Farmer).filter(
            (Farmer.phone == str(crop_in.farmer_id)) |
            (Farmer.phone == phone_str) |
            (Farmer.phone == f"+91{phone_str}")
        ).first()
        if farmer:
            crop_in.farmer_id = farmer.id

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {crop_in.farmer_id} does not exist"
        )
    
    crop = Crop(**crop_in.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)

    # Initialize inventory for this farmer and crop if not yet tracked
    try:
        from app.services.inventory_service import inventory_service
        inv_item = (
            db.query(InventoryItem)
            .filter(
                InventoryItem.farmer_id == crop.farmer_id,
                InventoryItem.crop_name.ilike(crop.crop_name.strip())
            )
            .first()
        )
        if not inv_item:
            inventory_service.get_or_create_inventory(
                db=db,
                farmer_id=crop.farmer_id,
                crop_name=crop.crop_name,
                initial_quantity=crop.quantity or 0.0,
                variety=crop.variety,
            )
    except Exception as e:
        print(f"Warning initializing inventory for crop {crop.id}: {e}")

    return crop


@router.put("/crops/{crop_id}", response_model=CropResponse)
def update_crop(crop_id: int, crop_in: CropUpdate, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID {crop_id} not found"
        )
    
    update_data = crop_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)
    
    db.commit()
    db.refresh(crop)
    return crop


@router.delete("/crops/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID {crop_id} not found"
        )
    db.delete(crop)
    db.commit()
    return None
