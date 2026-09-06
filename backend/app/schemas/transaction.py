from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class TransactionBase(BaseModel):
    lot_id: int
    farmer_id: Optional[int] = None
    buyer_id: Optional[int] = None
    offer_id: Optional[int] = None
    quantity_kg: Optional[float] = None
    final_price: float
    total_amount: Optional[float] = None
    status: Optional[str] = "CREATED"
    logistics_status: Optional[str] = "NOT_SCHEDULED"
    pickup_date: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    transport_cost_actual: Optional[float] = None
    payment_status: Optional[str] = "PENDING"
    expected_amount: Optional[float] = None
    paid_amount: Optional[float] = 0.0
    payment_date: Optional[str] = None
    payment_reference: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionStatusUpdate(BaseModel):
    status: str  # CREATED, CONFIRMED, PICKUP_SCHEDULED, IN_TRANSIT, DELIVERED, PAYMENT_PENDING, PAYMENT_RECEIVED, COMPLETED, DISPUTED, CANCELLED


class TransactionResponse(TransactionBase):
    id: int
    buyer_name: Optional[str] = None
    crop_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
