from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Buyer
from app.schemas.buyer import BuyerCreate, BuyerResponse
from app.schemas.buyer_matching import BuyerMatchingResponse, BuyerMatchResult
from app.services.buyer_matching_service import buyer_matching_service

router = APIRouter(prefix="/buyers", tags=["Buyers"])


@router.get("/recommended", response_model=BuyerMatchingResponse)
def get_recommended_buyers(
    crop_name: str = Query("Tomato", description="Crop name to match buyers for"),
    quantity_qtl: float = Query(20.0, ge=0.5, description="Produce quantity in quintals"),
    quality_grade: str = Query("Grade A", description="Quality grade"),
    location: str = Query("Nashik, Maharashtra", description="Farmer pickup location"),
    verified_only: bool = Query(False, description="Filter only verified enterprise buyers"),
    db: Session = Depends(get_db)
):
    """
    Get ranked institutional buyers for a farmer's crop and quantity,
    with explainable 0-100 match scores, reasons, and direct-vs-mandi net comparison.
    """
    return buyer_matching_service.match_buyers_for_lot(
        db=db,
        crop_name=crop_name,
        quantity_qtl=quantity_qtl,
        quality_grade=quality_grade,
        farmer_location=location,
        verified_only=verified_only,
    )


@router.get("/{buyer_id}/match", response_model=BuyerMatchResult)
def get_buyer_match_detail(
    buyer_id: int,
    crop_name: str = Query("Tomato"),
    quantity_qtl: float = Query(20.0),
    quality_grade: str = Query("Grade A"),
    location: str = Query("Nashik, Maharashtra"),
    db: Session = Depends(get_db)
):
    """Get detailed 7-factor match breakdown for a specific buyer."""
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer with ID {buyer_id} not found"
        )
    mandi_benchmark = buyer_matching_service.get_mandi_benchmark_price(db, crop_name)
    return buyer_matching_service.evaluate_buyer_match(
        buyer=buyer,
        crop_name=crop_name,
        quantity_qtl=quantity_qtl,
        quality_grade=quality_grade,
        farmer_location=location,
        mandi_benchmark=mandi_benchmark,
    )


@router.get("/", response_model=List[BuyerResponse])
def get_all_buyers(
    location: Optional[str] = None,
    verified_only: bool = False,
    crop: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Buyer)
    if location:
        query = query.filter(Buyer.location.ilike(f"%{location}%"))
    if verified_only:
        query = query.filter((Buyer.verified == True) | (Buyer.verification_status == "VERIFIED"))
    
    buyers = query.offset(skip).limit(limit).all()
    if crop and crop != "All":
        filtered = []
        for b in buyers:
            prefs = b.preferred_crops or []
            if any(crop.lower() in str(p).lower() for p in prefs):
                filtered.append(b)
        return filtered
    return buyers


@router.get("/{buyer_id}", response_model=BuyerResponse)
def get_buyer(buyer_id: int, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer with ID {buyer_id} not found"
        )
    return buyer


@router.post("/", response_model=BuyerResponse, status_code=status.HTTP_201_CREATED)
def create_buyer(buyer_in: BuyerCreate, db: Session = Depends(get_db)):
    buyer = Buyer(**buyer_in.model_dump())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer
