from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class BuyerMatchFactor(BaseModel):
    factor_name: str
    score: float
    max_score: float
    explanation: str
    is_positive: bool = True


class DirectVsMandiComparison(BaseModel):
    crop_name: str
    quantity_qtl: float
    quantity_kg: float
    
    # Direct Buyer Route
    direct_buyer_name: str
    direct_offer_price_per_kg: float
    direct_gross_revenue: float
    direct_transport_cost: float
    direct_other_fees: float
    direct_net_realization: float
    direct_net_per_kg: float

    # Mandi Route
    mandi_name: str
    mandi_price_per_kg: float
    mandi_gross_revenue: float
    mandi_transport_cost: float
    mandi_handling_and_cess: float
    mandi_net_realization: float
    mandi_net_per_kg: float

    # Advantage
    net_advantage_total: float
    net_advantage_per_kg: float
    recommended_channel: str  # "DIRECT_BUYER" or "APMC_MANDI"
    insight: str


class BuyerMatchResult(BaseModel):
    buyer_id: int
    buyer_name: str
    organization: Optional[str] = None
    location: str
    phone: Optional[str] = None
    email: Optional[str] = None
    verified: bool
    verification_status: str  # "VERIFIED", "PENDING", "UNVERIFIED"
    rating: float
    business_type: str
    indicative_price_per_kg: float
    match_score: int  # 0 to 100 ranking score (NOT probability)
    match_level: str  # "Excellent Match", "Strong Match", "Moderate Match", "Partial Match"
    reasons: List[str]
    warnings: List[str]
    comparison: Optional[DirectVsMandiComparison] = None
    factors: List[BuyerMatchFactor] = []


class BuyerMatchingResponse(BaseModel):
    crop_name: str
    quantity_qtl: float
    quality_grade: str
    matched_buyers_count: int
    top_matched_buyer: Optional[str] = None
    mandi_benchmark_price_per_kg: float
    buyers: List[BuyerMatchResult]


class CounterOfferRequest(BaseModel):
    counter_price: float = Field(..., gt=0, description="Counter price per kg in INR")
    quantity_kg: Optional[float] = Field(None, gt=0)
    message: Optional[str] = None
    counter_notes: Optional[str] = None
    notes: Optional[str] = None


class OfferHistoryItem(BaseModel):
    id: int
    offered_price: float
    counter_price: Optional[float] = None
    quantity_kg: Optional[float] = None
    sender_role: str  # "Buyer" or "Farmer"
    status: str
    message: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OfferIntelligenceResponse(BaseModel):
    offer_id: int
    lot_id: int
    buyer_id: int
    buyer_name: str
    organization: Optional[str] = None
    is_verified: bool
    verification_status: str
    offered_price: float
    mandi_benchmark_price: float
    price_premium_per_kg: float
    quantity_kg: float
    estimated_net_realization_total: float
    mandi_net_realization_total: float
    net_advantage_total: float
    match_score: int
    relative_attractiveness: str  # "Highly Attractive", "Competitive", "Below Mandi"
    suggested_counter_min: float
    suggested_counter_max: float
    negotiation_tip: str
    history: List[OfferHistoryItem] = []


class LogisticsUpdateRequest(BaseModel):
    logistics_status: str  # "NOT_SCHEDULED", "SCHEDULED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"
    pickup_date: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    transport_cost_actual: Optional[float] = None


class PaymentRecordRequest(BaseModel):
    paid_amount: float = Field(..., ge=0)
    payment_status: str  # "PENDING", "INITIATED", "PARTIAL", "RECEIVED", "DISPUTED"
    payment_date: Optional[str] = None
    payment_reference: Optional[str] = None


class DisputeCreateRequest(BaseModel):
    category: str = "payment"  # "payment", "quantity", "quality", "delivery", "other"
    description: str = Field(..., min_length=10)
    raised_by_role: str = "farmer"
    raised_by_id: Optional[int] = None


class DisputeResponse(BaseModel):
    id: int
    transaction_id: int
    raised_by_role: str
    raised_by_id: Optional[int] = None
    category: str
    description: str
    status: str  # "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class DisputeResolveRequest(BaseModel):
    status: str = "RESOLVED"  # "RESOLVED", "REJECTED", "UNDER_REVIEW"
    resolution_notes: str


class TransactionEventResponse(BaseModel):
    id: int
    stage_label: str
    description: Optional[str] = None
    done: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TransactionDetailResponse(BaseModel):
    id: int
    lot_id: int
    farmer_id: Optional[int] = None
    buyer_id: Optional[int] = None
    buyer_name: Optional[str] = None
    buyer_organization: Optional[str] = None
    crop_name: Optional[str] = None
    quantity_kg: float
    final_price: float
    total_amount: float
    status: str
    logistics_status: str
    pickup_date: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    transport_cost_actual: Optional[float] = None
    payment_status: str
    expected_amount: Optional[float] = None
    paid_amount: float = 0.0
    payment_date: Optional[str] = None
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    events: List[TransactionEventResponse] = []
    disputes: List[DisputeResponse] = []
    model_config = ConfigDict(from_attributes=True)
