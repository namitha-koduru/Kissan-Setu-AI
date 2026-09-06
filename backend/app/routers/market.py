from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Market, MarketPrice
from app.schemas.market import (
    MarketCreate,
    MarketResponse,
    MarketDetailResponse,
    MarketPriceCreate,
    MarketPriceResponse,
)

router = APIRouter(prefix="/markets", tags=["Markets"])


@router.get("/", response_model=List[MarketDetailResponse])
def get_all_markets(
    district: Optional[str] = None,
    crop: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Market)
    if district:
        query = query.filter(Market.district.ilike(f"%{district}%"))
    
    markets = query.offset(skip).limit(limit).all()
    return markets


@router.get("/{market_id}", response_model=MarketDetailResponse)
def get_market(market_id: int, db: Session = Depends(get_db)):
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market with ID {market_id} not found"
        )
    return market


@router.post("/", response_model=MarketResponse, status_code=status.HTTP_201_CREATED)
def create_market(market_in: MarketCreate, db: Session = Depends(get_db)):
    market = Market(**market_in.model_dump())
    db.add(market)
    db.commit()
    db.refresh(market)
    return market


@router.get("/{market_id}/prices", response_model=List[MarketPriceResponse])
def get_market_prices(
    market_id: int,
    crop_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market with ID {market_id} not found"
        )
    
    query = db.query(MarketPrice).filter(MarketPrice.market_id == market_id)
    if crop_name:
        query = query.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
    
    return query.all()


@router.post("/{market_id}/prices", response_model=MarketPriceResponse, status_code=status.HTTP_201_CREATED)
def add_market_price(market_id: int, price_in: MarketPriceCreate, db: Session = Depends(get_db)):
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market with ID {market_id} not found"
        )
    
    price_data = price_in.model_dump()
    price_data["market_id"] = market_id
    market_price = MarketPrice(**price_data)
    db.add(market_price)
    db.commit()
    db.refresh(market_price)
    return market_price
