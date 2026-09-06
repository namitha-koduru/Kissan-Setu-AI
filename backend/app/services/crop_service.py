from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import Crop
from app.schemas.crop import CropCreate, CropUpdate


class CropService:
    @staticmethod
    def get_crop_by_id(db: Session, crop_id: int) -> Optional[Crop]:
        return db.query(Crop).filter(Crop.id == crop_id).first()

    @staticmethod
    def get_crops_by_farmer(db: Session, farmer_id: int) -> List[Crop]:
        return db.query(Crop).filter(Crop.farmer_id == farmer_id).all()

    @staticmethod
    def create_crop(db: Session, crop_in: CropCreate) -> Crop:
        crop = Crop(
            farmer_id=crop_in.farmer_id,
            crop_name=crop_in.crop_name,
            variety=crop_in.variety,
            acreage=crop_in.acreage,
            quantity=crop_in.quantity,
            sowing_date=crop_in.sowing_date,
            expected_harvest_date=crop_in.expected_harvest_date,
            growth_stage=crop_in.growth_stage,
            soil_type=crop_in.soil_type,
        )
        db.add(crop)
        db.commit()
        db.refresh(crop)
        return crop

    @staticmethod
    def update_crop(db: Session, crop_id: int, crop_in: CropUpdate) -> Optional[Crop]:
        crop = db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop:
            return None
        update_data = crop_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(crop, field, value)
        db.commit()
        db.refresh(crop)
        return crop

    @staticmethod
    def delete_crop(db: Session, crop_id: int) -> bool:
        crop = db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop:
            return False
        db.delete(crop)
        db.commit()
        return True


crop_service = CropService()
