from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class PaymentCreateOrderRequest(BaseModel):
    transaction_id: int = Field(..., description="ID of the verified transaction to pay for")


class PaymentCreateOrderResponse(BaseModel):
    order_id: str
    amount_paise: int
    amount_inr: float
    currency: str = "INR"
    key_id: str
    transaction_id: int
    crop_name: str
    quantity_kg: float
    final_price: float
    buyer_name: str
    farmer_name: str
    test_mode: bool = True
    notes: Optional[Dict[str, Any]] = None


class PaymentVerifyRequest(BaseModel):
    transaction_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: int
    transaction_id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    payment_status: str
    amount: float
    currency: str = "INR"
    signature_verified: bool = False
    paid_at: Optional[datetime] = None
    created_at: datetime
    failure_reason: Optional[str] = None
    webhook_status: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentConfigResponse(BaseModel):
    key_id: str
    test_mode: bool
    currency: str = "INR"
