from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.market_intelligence import (
    MarketIntelligenceOverviewResponse,
    PriceHistorySummary,
    PriceForecastResponse,
    MarketComparisonItem,
    SellDecisionResponse,
    BuyerOpportunityItem,
    NetRealizationCalculationRequest,
    NetRealizationCalculationResponse,
)
from app.services.market_intelligence_service import market_intelligence_service

router = APIRouter(prefix="/market-intelligence", tags=["Market Intelligence & Price Discovery"])


@router.get("/overview", response_model=MarketIntelligenceOverviewResponse)
def get_market_intelligence_overview(
    crop: str = Query("Tomato", description="Target Crop Name"),
    farmer_id: int = Query(1, description="Farmer ID"),
    quantity: Optional[float] = Query(None, description="Harvest Quantity in kg"),
    db: Session = Depends(get_db)
):
    """
    Consolidated Market Intelligence & Price Discovery Endpoint.
    Combines current modal price, 7D/30D trends, price forecast with range bounds,
    SELL/WAIT/COMPARE decision, multi-mandi net realization comparison, and buyer opportunities.
    """
    return market_intelligence_service.get_market_intelligence_overview(
        db=db,
        crop_name=crop,
        farmer_id=farmer_id,
        quantity_kg=quantity
    )


@router.get("/trends", response_model=PriceHistorySummary)
def get_price_trends(
    crop: str = Query("Tomato", description="Target Crop Name"),
    market: str = Query("Lasalgaon APMC", description="Market / Mandi Name"),
    days: int = Query(30, description="Historical lookback window (days)"),
    db: Session = Depends(get_db)
):
    """
    Get historical price series, moving averages (7D, 30D), trend momentum, and volatility.
    """
    return market_intelligence_service.get_historical_prices(
        db=db,
        crop_name=crop,
        market_name=market,
        days=days
    )


@router.get("/forecast", response_model=PriceForecastResponse)
def get_price_forecast(
    crop: str = Query("Tomato", description="Target Crop Name"),
    market: str = Query("Lasalgaon APMC", description="Market / Mandi Name"),
    horizon: int = Query(3, description="Forecast horizon in days (3 or 7)"),
    db: Session = Depends(get_db)
):
    """
    Get explainable baseline trend-adjusted price forecast with expected price range [min, max],
    confidence level, drivers, and limitations.
    """
    history = market_intelligence_service.get_historical_prices(db=db, crop_name=crop, market_name=market, days=30)
    return market_intelligence_service.get_price_forecast(history=history, horizon_days=horizon)


@router.get("/compare", response_model=List[MarketComparisonItem])
def compare_markets(
    crop: str = Query("Tomato", description="Target Crop Name"),
    quantity: float = Query(2000.0, description="Harvest Quantity in kg"),
    location: str = Query("Nashik", description="Farmer origin location"),
    db: Session = Depends(get_db)
):
    """
    Compare nearby mandis ranked strictly by NET REALIZATION (Gross − Freight − Handling − Mandi Fees).
    """
    return market_intelligence_service.compare_markets(
        db=db,
        crop_name=crop,
        quantity_kg=quantity,
        farmer_location=location
    )


@router.get("/decision", response_model=SellDecisionResponse)
def get_sell_decision(
    crop: str = Query("Tomato", description="Target Crop Name"),
    quantity: float = Query(2000.0, description="Harvest Quantity in kg"),
    farmer_id: int = Query(1, description="Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Get structured SELL_NOW vs WAIT vs COMPARE_MARKETS decision with score, reason codes,
    and storage holding economics.
    """
    overview = market_intelligence_service.get_market_intelligence_overview(
        db=db,
        crop_name=crop,
        farmer_id=farmer_id,
        quantity_kg=quantity
    )
    return overview.decision


@router.get("/buyer-opportunities", response_model=List[BuyerOpportunityItem])
def get_buyer_opportunities(
    crop: str = Query("Tomato", description="Target Crop Name"),
    quantity: float = Query(2000.0, description="Harvest Quantity in kg"),
    db: Session = Depends(get_db)
):
    """
    Get matched institutional buyer opportunities ranked by opportunity score, price premium, and rating.
    """
    history = market_intelligence_service.get_historical_prices(db=db, crop_name=crop, market_name="Lasalgaon APMC", days=7)
    return market_intelligence_service.get_buyer_opportunities(
        db=db,
        crop_name=crop,
        quantity_kg=quantity,
        mandi_benchmark_qtl=history.current_modal_price
    )


@router.post("/net-realization", response_model=NetRealizationCalculationResponse)
def calculate_net_realization(
    req: NetRealizationCalculationRequest
):
    """
    Interactive Net Realization Calculator.
    Computes exact net in-hand realization after freight, handling, storage, and market fees.
    """
    return market_intelligence_service.calculate_net_realization(req)
