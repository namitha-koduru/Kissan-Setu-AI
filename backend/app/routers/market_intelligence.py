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
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    farmer_id: int = Query(1, description="Farmer ID"),
    quantity: Optional[float] = Query(None, description="Harvest Quantity in kg"),
    quantity_quintals: Optional[float] = Query(None, description="Harvest Quantity in quintals"),
    db: Session = Depends(get_db)
):
    """
    Consolidated Market Intelligence & Price Discovery Endpoint.
    Combines current modal price, 7D/30D trends, price forecast with range bounds,
    SELL/WAIT/COMPARE decision, multi-mandi net realization comparison, and buyer opportunities.
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    qty_kg = (quantity_quintals * 100.0) if quantity_quintals is not None else quantity

    return market_intelligence_service.get_market_intelligence_overview(
        db=db,
        crop_name=target_crop,
        farmer_id=farmer_id,
        quantity_kg=qty_kg
    )


@router.get("/trends", response_model=PriceHistorySummary)
def get_price_trends(
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    market: str = Query("Lasalgaon APMC", description="Market / Mandi Name"),
    days: int = Query(30, description="Historical lookback window (days)"),
    db: Session = Depends(get_db)
):
    """
    Get historical price series, moving averages (7D, 30D), trend momentum, and volatility.
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    return market_intelligence_service.get_historical_prices(
        db=db,
        crop_name=target_crop,
        market_name=market,
        days=days
    )


@router.get("/forecast", response_model=PriceForecastResponse)
def get_price_forecast(
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    market: str = Query("Lasalgaon APMC", description="Market / Mandi Name"),
    horizon: Optional[int] = Query(None, description="Forecast horizon in days (3 or 7)"),
    days_ahead: Optional[int] = Query(None, description="Forecast horizon days ahead alias"),
    db: Session = Depends(get_db)
):
    """
    Get explainable baseline trend-adjusted price forecast with expected price range [min, max],
    confidence level, drivers, and limitations.
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    target_horizon = days_ahead or horizon or 3
    history = market_intelligence_service.get_historical_prices(db=db, crop_name=target_crop, market_name=market, days=30)
    return market_intelligence_service.get_price_forecast(history=history, horizon_days=target_horizon)


@router.get("/compare", response_model=List[MarketComparisonItem])
def compare_markets(
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    quantity: Optional[float] = Query(None, description="Harvest Quantity in kg"),
    quantity_quintals: Optional[float] = Query(None, description="Harvest Quantity in quintals"),
    location: str = Query("Nashik", description="Farmer origin location"),
    db: Session = Depends(get_db)
):
    """
    Compare nearby mandis ranked strictly by NET REALIZATION (Gross − Freight − Handling − Mandi Fees).
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    qty_kg = (quantity_quintals * 100.0) if quantity_quintals is not None else (quantity or 2000.0)
    return market_intelligence_service.compare_markets(
        db=db,
        crop_name=target_crop,
        quantity_kg=qty_kg,
        farmer_location=location
    )


@router.get("/decision", response_model=SellDecisionResponse)
def get_sell_decision(
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    quantity: Optional[float] = Query(None, description="Harvest Quantity in kg"),
    quantity_quintals: Optional[float] = Query(None, description="Harvest Quantity in quintals"),
    farmer_id: int = Query(1, description="Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Get structured SELL_NOW vs WAIT vs COMPARE_MARKETS decision with score, reason codes,
    and storage holding economics.
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    qty_kg = (quantity_quintals * 100.0) if quantity_quintals is not None else (quantity or 2000.0)
    overview = market_intelligence_service.get_market_intelligence_overview(
        db=db,
        crop_name=target_crop,
        farmer_id=farmer_id,
        quantity_kg=qty_kg
    )
    return overview.decision


@router.get("/buyer-opportunities", response_model=List[BuyerOpportunityItem])
def get_buyer_opportunities(
    crop: Optional[str] = Query(None, description="Target Crop Name"),
    crop_name: Optional[str] = Query(None, description="Target Crop Name alias"),
    quantity: Optional[float] = Query(None, description="Harvest Quantity in kg"),
    min_quantity: Optional[float] = Query(None, description="Minimum quantity in quintals"),
    db: Session = Depends(get_db)
):
    """
    Get matched institutional buyer opportunities ranked by opportunity score, price premium, and rating.
    """
    target_crop = (crop_name or crop or "Tomato").strip()
    qty_kg = (min_quantity * 100.0) if min_quantity is not None else (quantity or 2000.0)
    history = market_intelligence_service.get_historical_prices(db=db, crop_name=target_crop, market_name="Lasalgaon APMC", days=7)
    return market_intelligence_service.get_buyer_opportunities(
        db=db,
        crop_name=target_crop,
        quantity_kg=qty_kg,
        mandi_benchmark_qtl=history.current_modal_price
    )


@router.post("/net-realization", response_model=NetRealizationCalculationResponse)
@router.post("/calculate-net", response_model=NetRealizationCalculationResponse)
def calculate_net_realization(
    req: NetRealizationCalculationRequest
):
    """
    Interactive Net Realization Calculator.
    Computes exact net in-hand realization after freight, handling, storage, and market fees.
    """
    return market_intelligence_service.calculate_net_realization(req)
