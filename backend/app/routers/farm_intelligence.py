from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import SoilProfile, Crop, Farmer
from app.schemas.farm_intelligence import (
    FarmIntelligenceOverviewResponse,
    FarmRecommendationItem,
    FarmActionPlan,
    CropSuitabilityItem,
    FarmRiskSummary,
)
from app.services.farm_intelligence_service import farm_intelligence_service
from app.services.crop_suitability_engine import crop_suitability_engine
from app.services.weather_intelligence import weather_intelligence_service
from app.services.farm_risk_service import farm_risk_service

router = APIRouter(prefix="/farm-intelligence", tags=["Farm Intelligence Engine"])


@router.get("/overview", response_model=FarmIntelligenceOverviewResponse)
def get_farm_intelligence_overview(
    farmer_id: int = Query(1, description="Farmer ID"),
    location: Optional[str] = Query(None, description="Optional custom district/location"),
    db: Session = Depends(get_db)
):
    """
    Consolidated Farm Intelligence Overview.
    Combines farm profile, active crops, soil health interpretation, weather signals,
    overall farm risk rating, actionable recommendations, and explainable crop suitability ranking.
    """
    return farm_intelligence_service.get_farm_intelligence_overview(
        db=db,
        farmer_id=farmer_id,
        explicit_location=location
    )


@router.get("/recommendations", response_model=List[FarmRecommendationItem])
def get_farm_recommendations(
    farmer_id: int = Query(1, description="Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Get prioritized, explainable agronomic recommendations and action items.
    """
    overview = farm_intelligence_service.get_farm_intelligence_overview(db=db, farmer_id=farmer_id)
    return overview.recommendations


@router.get("/action-plan", response_model=FarmActionPlan)
def get_farm_action_plan(
    farmer_id: int = Query(1, description="Farmer ID"),
    db: Session = Depends(get_db)
):
    """
    Get Daily (Today) and Weekly Farm Action Plan structured by urgency and priority.
    """
    overview = farm_intelligence_service.get_farm_intelligence_overview(db=db, farmer_id=farmer_id)
    return overview.action_plan


@router.get("/risks", response_model=FarmRiskSummary)
def get_farm_risks(
    farmer_id: int = Query(1, description="Farmer ID"),
    location: str = Query("Nashik", description="Location/District"),
    db: Session = Depends(get_db)
):
    """
    Get multi-source agricultural risk analysis (Weather, Soil, Crop Stage, Harvest).
    """
    crops = db.query(Crop).filter(Crop.farmer_id == farmer_id).all()
    soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    weather_signals = weather_intelligence_service.extract_weather_signals(location)
    return farm_risk_service.evaluate_farm_risks(crops, soil, weather_signals)


@router.get("/crop-suitability", response_model=List[CropSuitabilityItem])
def get_crop_suitability_rankings(
    farmer_id: int = Query(1, description="Farmer ID"),
    location: str = Query("Nashik, Maharashtra", description="Farm location"),
    acreage: Optional[float] = Query(None, description="Available acreage"),
    db: Session = Depends(get_db)
):
    """
    Calculate explainable crop suitability scores (0-100) combining soil type, pH, nutrients,
    meteorological forecast, and seasonality.
    """
    soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer_id).first()
    weather_signals = weather_intelligence_service.extract_weather_signals(location)
    return crop_suitability_engine.rank_crops_for_farm(
        soil=soil,
        weather=weather_signals,
        location=location,
        acreage=acreage
    )
