from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class MarketComparisonItem(BaseModel):
    market_id: int
    market_name: str
    mandi_price: float
    distance_km: float
    transport_cost: float
    storage_cost: float
    handling_loss: float
    net_realization: float
    demand: str
    is_recommended: bool


class RecommendationRequest(BaseModel):
    farmer_id: Optional[int] = None
    crop_name: str
    quantity_kg: float
    growth_stage: str
    location: str
    sowing_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None



class RecommendationResponse(BaseModel):
    decision: str  # SELL, WAIT, SWITCH
    confidence_score: int  # 0 to 100
    crop_name: str
    quantity_kg: float
    growth_stage: str
    harvest_window: str
    weather_risk: str
    buyer_demand: str
    best_market: str
    expected_net_realization: float
    total_expected_revenue: float
    reasons: List[str]
    market_comparisons: List[MarketComparisonItem]
    score_breakdown: Dict[str, Any]
