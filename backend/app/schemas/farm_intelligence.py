from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.soil import SoilInterpretationResponse, SoilProfileResponse


class CropSuitabilityItem(BaseModel):
    crop: str
    suitability_score: int = Field(..., ge=0, le=100, description="Score between 0 and 100")
    confidence: str = Field("Moderate", description="'High', 'Moderate', 'Low (Partial Data)'")
    compatibility_level: str = Field("Suitable", description="'Highly Suitable', 'Suitable', 'Moderate', 'Challenging'")
    reasons: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    optimal_season: str = "Rabi / Kharif"
    expected_duration_days: Optional[int] = None
    market_potential: str = "High"


class WeatherSignals(BaseModel):
    rain_risk: str = Field("low", description="'low', 'medium', 'high'")
    rain_probability: int = 0
    spraying_risk: str = Field("safe", description="'safe', 'caution', 'avoid'")
    irrigation_need: str = Field("normal", description="'skip', 'reduced', 'normal', 'increase'")
    harvest_weather_risk: str = Field("low", description="'low', 'medium', 'high'")
    temperature_stress: str = Field("normal", description="'heat_stress', 'cold_stress', 'optimal', 'normal'")
    advisories: List[str] = Field(default_factory=list)


class FarmRiskItem(BaseModel):
    type: str = Field(..., description="'weather', 'soil', 'irrigation', 'crop_health', 'harvest'")
    severity: str = Field(..., description="'high', 'medium', 'low'")
    title: str
    reason: str
    action: Optional[str] = None


class FarmRiskSummary(BaseModel):
    overall_risk: str = Field("low", description="'low', 'medium', 'high'")
    risk_score: int = Field(25, ge=0, le=100)
    risks: List[FarmRiskItem] = Field(default_factory=list)


class FarmRecommendationItem(BaseModel):
    priority: str = Field("medium", description="'high', 'medium', 'low'")
    category: str = Field(..., description="'irrigation', 'soil', 'weather', 'crop-care', 'harvest', 'monitoring', 'risk'")
    title: str
    reason: str
    action: str
    confidence: float = 0.85
    urgency: str = "Today"  # "Today", "This Week", "Routine"


class FarmActionPlan(BaseModel):
    today: List[FarmRecommendationItem] = Field(default_factory=list)
    this_week: List[FarmRecommendationItem] = Field(default_factory=list)
    routine: List[FarmRecommendationItem] = Field(default_factory=list)


class ActiveCropIntelligence(BaseModel):
    id: int
    crop_name: str
    variety: Optional[str] = None
    acreage: Optional[float] = None
    quantity: float
    growth_stage: str
    estimated_stage: Optional[str] = None
    stage_is_estimate: bool = False
    sowing_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    health_status: str = "Good"
    soil_match: str = "Compatible"
    risks: List[FarmRiskItem] = Field(default_factory=list)
    recommendations: List[FarmRecommendationItem] = Field(default_factory=list)


class FarmIntelligenceOverviewResponse(BaseModel):
    farm: Dict[str, Any]
    weather: WeatherSignals
    weather_summary: Dict[str, Any]
    soil: SoilInterpretationResponse
    active_crops: List[ActiveCropIntelligence]
    risks: FarmRiskSummary
    recommendations: List[FarmRecommendationItem]
    action_plan: FarmActionPlan
    crop_suitability: List[CropSuitabilityItem]
    data_completeness: Dict[str, Any]
    generated_at: str
