from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Offer, Lot, Buyer
from app.schemas.offer import OfferCreate, OfferStatusUpdate, OfferResponse
from app.schemas.buyer_matching import (
    OfferIntelligenceResponse,
    OfferHistoryItem,
    CounterOfferRequest,
)
from app.schemas.transaction import TransactionResponse
from app.services.offer_intelligence_service import offer_intelligence_service
from app.services.transaction_service import transaction_service

router = APIRouter(tags=["Offers"])


@router.get("/lots/{lot_id}/offers", response_model=List[OfferResponse])
def get_lot_offers(lot_id: int, db: Session = Depends(get_db)):
    lot = db.query(Lot).filter(Lot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lot with ID {lot_id} not found"
        )
    offers = db.query(Offer).filter(Offer.lot_id == lot_id).order_by(Offer.created_at.desc()).all()
    res = []
    for o in offers:
        b = db.query(Buyer).filter(Buyer.id == o.buyer_id).first()
        r = OfferResponse.model_validate(o)
        if b:
            r.buyer_name = b.name
            r.buyer_verified = b.verified or (b.verification_status == "VERIFIED")
        res.append(r)
    return res


@router.get("/offers", response_model=List[OfferResponse])
def get_all_offers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    offers = db.query(Offer).order_by(Offer.created_at.desc()).offset(skip).limit(limit).all()
    res = []
    for o in offers:
        b = db.query(Buyer).filter(Buyer.id == o.buyer_id).first()
        r = OfferResponse.model_validate(o)
        if b:
            r.buyer_name = b.name
            r.buyer_verified = b.verified or (b.verification_status == "VERIFIED")
        res.append(r)
    return res


@router.get("/offers/{offer_id}/intelligence", response_model=OfferIntelligenceResponse)
def get_offer_intelligence(offer_id: int, db: Session = Depends(get_db)):
    """Evaluate offer against Mandi modal benchmark with net realization comparison and AI negotiation guidance."""
    return offer_intelligence_service.get_offer_intelligence(db=db, offer_id=offer_id)


@router.get("/offers/{offer_id}/history", response_model=List[OfferHistoryItem])
def get_offer_history(offer_id: int, db: Session = Depends(get_db)):
    """Fetch complete immutable negotiation and counter-offer history."""
    return offer_intelligence_service.get_offer_history(db=db, offer_id=offer_id)


@router.post("/offers/{offer_id}/counter", response_model=OfferResponse)
def counter_offer(offer_id: int, counter_in: CounterOfferRequest, db: Session = Depends(get_db)):
    """Submit a counter-offer to the buyer with updated asking price and notes."""
    updated = offer_intelligence_service.counter_offer(db=db, offer_id=offer_id, counter_data=counter_in)
    b = db.query(Buyer).filter(Buyer.id == updated.buyer_id).first()
    res = OfferResponse.model_validate(updated)
    if b:
        res.buyer_name = b.name
        res.buyer_verified = b.verified or (b.verification_status == "VERIFIED")
    return res


@router.post("/offers/{offer_id}/accept", response_model=TransactionResponse)
def accept_offer(offer_id: int, db: Session = Depends(get_db)):
    """Accept the buyer's offer and atomically generate the verified transaction contract."""
    tx = transaction_service.accept_offer_and_create_transaction(db=db, offer_id=offer_id)
    b = db.query(Buyer).filter(Buyer.id == tx.buyer_id).first() if tx.buyer_id else None
    res = TransactionResponse.model_validate(tx)
    if b:
        res.buyer_name = b.name
    return res


@router.post("/offers/{offer_id}/reject", response_model=OfferResponse)
def reject_offer(offer_id: int, db: Session = Depends(get_db)):
    """Reject incoming offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    offer.status = "Rejected"
    offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(offer)
    b = db.query(Buyer).filter(Buyer.id == offer.buyer_id).first()
    res = OfferResponse.model_validate(offer)
    if b:
        res.buyer_name = b.name
        res.buyer_verified = b.verified or (b.verification_status == "VERIFIED")
    return res


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
    res = OfferResponse.model_validate(offer)
    res.buyer_name = buyer.name
    res.buyer_verified = buyer.verified or (buyer.verification_status == "VERIFIED")
    return res


@router.put("/offers/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(offer_id: int, status_in: OfferStatusUpdate, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found"
        )
    
    offer.status = status_in.status
    offer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(offer)
    b = db.query(Buyer).filter(Buyer.id == offer.buyer_id).first()
    res = OfferResponse.model_validate(offer)
    if b:
        res.buyer_name = b.name
        res.buyer_verified = b.verified or (b.verification_status == "VERIFIED")
    return res
