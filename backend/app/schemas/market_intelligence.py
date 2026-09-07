from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class PriceTrendPoint(BaseModel):
    date: str
    price: float  # in INR per kg or quintal
    modal_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    is_forecast: bool = False


class PriceHistorySummary(BaseModel):
    crop: str
    market: str
    unit: str = "quintal"  # "quintal" (₹/Qtl) or "kg"
    current_modal_price: float
    current_price_per_kg: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_7d: Optional[float] = None
    avg_30d: Optional[float] = None
    change_7d_percent: Optional[float] = None
    change_30d_percent: Optional[float] = None
    trend_direction: str = Field("stable", description="'strongly_rising', 'rising', 'stable', 'falling', 'strongly_falling', 'insufficient_data'")
    volatility: str = Field("medium", description="'low', 'medium', 'high'")
    recent_high: Optional[float] = None
    recent_low: Optional[float] = None
    data_points_count: int = 0
    data_freshness: str = "Updated today"
    history: List[PriceTrendPoint] = Field(default_factory=list)


class PriceForecastResponse(BaseModel):
    crop: str
    forecast_horizon_days: int = 3
    expected_price_qtl: float
    expected_price_kg: float
    expected_range_qtl: List[float] = Field(..., description="[min_expected, max_expected]")
    confidence: str = Field("medium", description="'high', 'medium', 'low'")
    method: str = "trend_adjusted_historical_baseline"
    drivers: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    forecast_points: List[PriceTrendPoint] = Field(default_factory=list)


class MarketComparisonItem(BaseModel):
    market_id: int
    market_name: str
    district: str
    state: str = "Maharashtra"
    distance_km: float
    modal_price_qtl: float
    modal_price_per_kg: float
    price_diff_vs_local_qtl: float
    estimated_transport_cost: float
    estimated_handling_cost: float
    estimated_market_charges: float
    estimated_gross_revenue: float
    estimated_net_realization: float
    net_price_per_kg: float
    net_price_per_qtl: float
    buyer_demand: str = "High"
    trend_direction: str = "stable"
    is_best_market: bool = False
    opportunity_tag: Optional[str] = None


class SellDecisionResponse(BaseModel):
    action: str = Field(..., description="'SELL_NOW', 'WAIT', 'COMPARE_MARKETS', 'INSUFFICIENT_DATA'")
    action_label: str = "Compare Nearby Mandis"
    decision_score: int = Field(..., ge=0, le=100, description="Decision confidence score (0-100)")
    headline: str
    reason_codes: List[str] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    storage_analysis: Optional[Dict[str, Any]] = None
    weather_factor: Optional[str] = None
    suggested_timeline: str = "Next 2–4 days"


class BuyerOpportunityItem(BaseModel):
    buyer_id: int
    name: str
    organization: Optional[str] = None
    location: str
    distance_km: float
    crop: str
    required_quantity_mt: float
    indicative_offer_qtl: float
    indicative_offer_kg: float
    verification_status: str = "Verified Buyer"
    rating: float = 4.5
    payment_terms: str = "Same-Day Direct Bank Transfer (Escrow)"
    opportunity_score: int = Field(88, ge=0, le=100)
    matching_reasons: List[str] = Field(default_factory=list)
    is_top_buyer: bool = False


class NetRealizationCalculationRequest(BaseModel):
    crop_name: str = "Tomato"
    quantity_kg: float = 2000.0  # 20 Quintals
    selling_price_qtl: float = 2850.0
    distance_km: float = 25.0
    transport_cost_manual: Optional[float] = None
    handling_cost_per_qtl: float = 25.0
    market_cess_percent: float = 1.05  # APMC mandi cess %
    storage_days: int = 0
    storage_cost_per_qtl_day: float = 5.0
    estimated_transit_loss_percent: float = 1.0


class NetRealizationCalculationResponse(BaseModel):
    quantity_kg: float
    quantity_qtl: float
    selling_price_qtl: float
    selling_price_kg: float
    gross_revenue: float
    transport_cost: float
    handling_cost: float
    market_charges: float
    storage_cost: float
    transit_loss_value: float
    total_costs: float
    estimated_net_realization: float
    net_price_per_qtl: float
    net_price_per_kg: float
    cost_deduction_percent: float


class MarketIntelligenceOverviewResponse(BaseModel):
    crop: Dict[str, Any]
    crop_name: Optional[str] = None
    quantity_quintals: Optional[float] = None
    current_price: PriceHistorySummary
    analytics: Optional[Any] = None
    trend: Dict[str, Any]
    forecast: PriceForecastResponse
    decision: SellDecisionResponse
    best_market: MarketComparisonItem
    best_buyer: Optional[BuyerOpportunityItem] = None
    market_comparisons: List[MarketComparisonItem] = Field(default_factory=list)
    comparison: Optional[Any] = None
    buyer_opportunities: Any = Field(default_factory=list)
    farm_context_summary: Dict[str, Any]
    data_source: str = "Verified Regional APMC Mandi & Institutional Aggregators"
    generated_at: str

    model_config = ConfigDict(from_attributes=True)
