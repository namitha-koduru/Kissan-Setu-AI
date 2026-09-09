"""
Razorpay Payment API Router for KissanSetuAI.
Provides secure endpoints for Order Creation, Signature Verification, Webhook Processing, and Status Query.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Transaction, Payment
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Razorpay Payments"])


class CreateOrderRequest(BaseModel):
    transaction_id: int = Field(..., description="Authoritative transaction ID")
    buyer_id: Optional[int] = Field(None, description="Optional buyer identifier")


class CreateOrderResponse(BaseModel):
    order_id: str
    key_id: str
    amount: float
    amount_paise: int
    currency: str
    transaction_id: int
    is_test_mode: bool
    receipt: str


class VerifyPaymentRequest(BaseModel):
    transaction_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentStatusResponse(BaseModel):
    payment_id: Optional[int] = None
    transaction_id: int
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_status: str
    amount: float
    currency: str
    created_at: Optional[str] = None
    paid_at: Optional[str] = None
    signature_verified: bool
    webhook_status: str


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db),
):
    """
    Creates a server-authoritative Razorpay Order from the database transaction details.
    Guarantees payable amount matches transaction and cannot be manipulated by frontend.
    """
    try:
        result = await payment_service.create_order(
            db=db,
            transaction_id=req.transaction_id,
            buyer_id=req.buyer_id,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(exc)}",
        )


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db),
):
    """
    Verifies the Razorpay payment signature server-side.
    Only updates transaction payment status once signature verification succeeds.
    """
    success, result = payment_service.verify_payment_signature(
        db=db,
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Payment verification failed."),
        )
    return result


@router.post("/webhook")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Handles asynchronous Razorpay webhook events (order.paid, payment.captured, payment.failed).
    Performs HMAC-SHA256 signature check against RAZORPAY_WEBHOOK_SECRET and idempotent processing.
    """
    raw_body = await request.body()
    try:
        import json
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON body.",
        )

    try:
        result = payment_service.process_webhook_event(
            db=db,
            raw_body=raw_body,
            signature_header=x_razorpay_signature,
            event_payload=payload,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(exc)}",
        )


@router.get("/{transaction_id}", response_model=List[PaymentStatusResponse])
def get_payments_for_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves payment audit records for a given transaction.
    """
    payments = db.query(Payment).filter(
        Payment.transaction_id == transaction_id
    ).order_by(Payment.created_at.desc()).all()

    if not payments:
        # Check if transaction exists
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction #{transaction_id} not found.",
            )
        return []

    return [
        PaymentStatusResponse(
            payment_id=p.id,
            transaction_id=p.transaction_id,
            razorpay_order_id=p.razorpay_order_id,
            razorpay_payment_id=p.razorpay_payment_id,
            payment_status=p.payment_status,
            amount=p.amount,
            currency=p.currency,
            created_at=p.created_at.isoformat() if p.created_at else None,
            paid_at=p.paid_at.isoformat() if p.paid_at else None,
            signature_verified=p.signature_verified,
            webhook_status=p.webhook_status,
        )
        for p in payments
    ]
