from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Buyer
from app.schemas.buyer import BuyerCreate, BuyerResponse

router = APIRouter(prefix="/buyers", tags=["Buyers"])


@router.get("/", response_model=List[BuyerResponse])
def get_all_buyers(
    location: Optional[str] = None,
    verified_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Buyer)
    if location:
        query = query.filter(Buyer.location.ilike(f"%{location}%"))
    if verified_only:
        query = query.filter(Buyer.verified == True)
    
    return query.offset(skip).limit(limit).all()


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
