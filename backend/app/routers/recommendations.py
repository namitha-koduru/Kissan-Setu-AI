from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=RecommendationResponse)
def get_default_recommendation(
    crop: str = Query("Tomato", description="Target crop name"),
    quantity: float = Query(2400.0, description="Harvest quantity in kg"),
    location: str = Query("Nashik, Maharashtra", description="Farm location"),
    stage: str = Query("Near maturity (70-80% red)", description="Current crop growth stage"),
    db: Session = Depends(get_db)
):
    """
    Get rule-based & AI agronomic recommendation for harvest, market routing, and cold chain decisions.
    """
    req = RecommendationRequest(
        crop_name=crop,
        quantity_kg=quantity,
        growth_stage=stage,
        location=location
    )
    return recommendation_service.generate_recommendation(req, db)


@router.post("/analyze", response_model=RecommendationResponse)
def analyze_crop_recommendation(
    req: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate customized AI decision recommendation for specific farm & crop parameters.
    """
    return recommendation_service.generate_recommendation(req, db)
