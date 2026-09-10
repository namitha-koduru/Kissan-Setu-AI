from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
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
    farmer_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    crop_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Lot)
    if farmer_id:
        query = query.filter(Lot.farmer_id == farmer_id)
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
def create_lot(
    lot_in: LotCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    """
    Creates a new harvest lot.
    Strict Permission Enforcement: Buyers are strictly forbidden from creating lots.
    """
    if x_user_role and x_user_role.lower() == "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lot creation is available only to Farmers and FPOs. Buyers are not permitted to list produce lots."
        )

    # 1. Resolve Farmer record authoritatively
    farmer = db.query(Farmer).filter(Farmer.id == lot_in.farmer_id).first()
    if not farmer and x_user_id:
        try:
            uid = int(x_user_id)
            farmer = db.query(Farmer).filter(Farmer.id == uid).first()
            if farmer:
                lot_in.farmer_id = farmer.id
        except (ValueError, TypeError):
            pass

    if not farmer and lot_in.farmer_id and lot_in.farmer_id > 1000000000:
        phone_str = str(lot_in.farmer_id)[-10:]
        farmer = db.query(Farmer).filter(
            (Farmer.phone == str(lot_in.farmer_id)) |
            (Farmer.phone == phone_str) |
            (Farmer.phone == f"+91{phone_str}")
        ).first()
        if farmer:
            lot_in.farmer_id = farmer.id

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with ID {lot_in.farmer_id} not found"
        )

    # 2. Verify crop exists and belongs to this farmer
    crop = db.query(Crop).filter(Crop.id == lot_in.crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crop with ID {lot_in.crop_id} not found"
        )
    if crop.farmer_id != farmer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create lot: This crop does not belong to the authenticated farmer."
        )

    # If image_id is provided, verify it exists
    if lot_in.image_id:
        img = db.query(CropImage).filter(CropImage.id == lot_in.image_id).first()
        if not img:
            lot_in.image_id = None  # Graceful fallback

    # Validate stock and allocate inventory
    from app.services.inventory_service import inventory_service
    inventory_service.allocate_to_lot(
        db=db,
        farmer_id=lot_in.farmer_id,
        crop_name=crop.crop_name,
        quantity=lot_in.quantity,
    )

    lot = Lot(**lot_in.model_dump())
    db.add(lot)
    db.commit()
    db.refresh(lot)

    try:
        from app.services.websocket_manager import websocket_manager
        import asyncio
        asyncio.create_task(websocket_manager.broadcast_to_room("marketplace", {
            "type": "LOT_CREATED",
            "lot_id": lot.id,
            "crop_name": crop.crop_name,
            "quantity_kg": lot.quantity,
            "asking_price": lot.asking_price,
            "farmer_name": farmer.name,
            "location": lot.location,
            "quality": lot.quality,
        }))
    except Exception:
        pass

    return lot


@router.put("/lots/{lot_id}", response_model=LotResponse)
def update_lot(
    lot_id: int,
    lot_in: LotUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    if x_user_role and x_user_role.lower() == "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyers cannot edit seller harvest lots."
        )

    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    
    prev_status = lot.status
    update_data = lot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lot, field, value)
    
    # If lot is cancelled or expired, release allocated stock
    if lot.status in ["Cancelled", "Expired", "Closed"] and prev_status == "Open for Offers":
        try:
            from app.services.inventory_service import inventory_service
            crop_name = lot.crop.crop_name if lot.crop else "Produce"
            inventory_service.release_from_lot(
                db=db,
                farmer_id=lot.farmer_id,
                crop_name=crop_name,
                quantity=lot.quantity,
                lot_id=lot.id,
            )
        except Exception as e:
            print(f"Warning releasing lot stock: {e}")

    db.commit()
    db.refresh(lot)
    return lot


@router.delete("/lots/{lot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lot(
    lot_id: int,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    if x_user_role and x_user_role.lower() == "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyers cannot delete harvest lots."
        )

    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )

    if lot.status == "Open for Offers":
        try:
            from app.services.inventory_service import inventory_service
            crop_name = lot.crop.crop_name if lot.crop else "Produce"
            inventory_service.release_from_lot(
                db=db,
                farmer_id=lot.farmer_id,
                crop_name=crop_name,
                quantity=lot.quantity,
                lot_id=lot.id,
            )
        except Exception as e:
            print(f"Warning releasing lot stock on delete: {e}")

    db.delete(lot)
    db.commit()
    return None


@router.get("/lots/{lot_id}/nearby-demand")
def get_lot_nearby_demand(lot_id: int, radius_km: float = 25.0, db: Session = Depends(get_db)):
    """
    Returns matched buyers and FPOs within ~25 km for a specific harvest lot.
    """
    from app.services.buyer_matching_service import buyer_matching_service
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    return buyer_matching_service.get_nearby_demand_for_lot(db=db, lot=lot, max_radius_km=radius_km)


@router.get("/lots/nearby/discovery")
def discover_nearby_lots_for_buyer(
    buyer_location: Optional[str] = "Nashik, Maharashtra",
    crop: Optional[str] = None,
    max_distance_km: float = 50.0,
    db: Session = Depends(get_db)
):
    """
    For Buyers and FPOs to discover available farmer produce lots nearby.
    """
    from app.services.buyer_matching_service import get_coords_from_location, haversine_distance
    buyer_coords = get_coords_from_location(buyer_location) or (19.9975, 73.7898)
    
    query = db.query(Lot).filter(Lot.status == "Open for Offers")
    if crop and crop != "All":
        query = query.join(Crop).filter(Crop.crop_name.ilike(f"%{crop}%"))
    
    all_lots = query.all()
    results = []
    
    for l in all_lots:
        farmer = l.farmer
        f_coords = None
        if farmer and farmer.latitude and farmer.longitude:
            f_coords = (farmer.latitude, farmer.longitude)
        else:
            f_coords = get_coords_from_location(l.location) or (
                get_coords_from_location(farmer.district) if farmer else (19.9975, 73.7898)
            )
        
        dist = haversine_distance(buyer_coords[0], buyer_coords[1], f_coords[0], f_coords[1])
        
        results.append({
            "id": l.id,
            "crop_id": l.crop_id,
            "crop_name": l.crop.crop_name if l.crop else "Produce",
            "variety": l.crop.variety if l.crop else None,
            "farmer_id": l.farmer_id,
            "farmer_name": l.farmer.name if l.farmer else "Local Farmer",
            "farmer_phone": l.farmer.phone if l.farmer else None,
            "quantity_kg": l.quantity,
            "asking_price": l.asking_price,
            "quality": l.quality,
            "quality_description": l.quality_description,
            "harvest_date": l.harvest_date,
            "harvest_window": l.harvest_window,
            "location": l.location,
            "distance_km": dist,
            "status": l.status,
            "image_url": l.crop.image_url if l.crop else None,
            "created_at": l.created_at,
        })
    
    # Sort by distance
    results.sort(key=lambda x: x["distance_km"])
    return results

