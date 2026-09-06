from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Offer, Lot, Buyer
from app.schemas.offer import OfferCreate, OfferStatusUpdate, OfferResponse

router = APIRouter(tags=["Offers"])


@router.get("/lots/{lot_id}/offers", response_model=List[OfferResponse])
def get_lot_offers(lot_id: int, db: Session = Depends(get_db)):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    return db.query(Offer).filter(Offer.lot_id == lot_id).all()


@router.get("/offers", response_model=List[OfferResponse])
def get_all_offers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Offer).offset(skip).limit(limit).all()


@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(offer_in: OfferCreate, db: Session = Depends(get_db)):
    lot = db.query(Lot).filter(Lot.id == offer_in.lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {offer_in.lot_id} not found"
        )
    
    buyer = db.query(Buyer).filter(Buyer.id == offer_in.buyer_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer with ID {offer_in.buyer_id} not found"
        )

    offer = Offer(**offer_in.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.put("/offers/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(offer_id: int, status_in: OfferStatusUpdate, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    offer.status = status_in.status
    db.commit()
    db.refresh(offer)
    return offer
