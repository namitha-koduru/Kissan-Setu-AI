from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Payment, Transaction
from app.schemas.payment import (
    PaymentCreateOrderRequest,
    PaymentCreateOrderResponse,
    PaymentVerifyRequest,
    PaymentResponse,
    PaymentConfigResponse,
)
from app.services.razorpay_service import razorpay_service

router = APIRouter(prefix="/payments", tags=["Razorpay Payments"])


@router.get("/config", response_model=PaymentConfigResponse)
def get_payment_config():
    """
    Public Razorpay client configuration for frontend Standard Checkout.
    Never exposes key_secret or webhook_secret.
    """
    cfg = razorpay_service.get_public_config()
    return PaymentConfigResponse(
        key_id=cfg["key_id"],
        test_mode=cfg["test_mode"],
        currency=cfg["currency"],
    )


@router.post("/create-order", response_model=PaymentCreateOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_razorpay_order(
    req: PaymentCreateOrderRequest,
    db: Session = Depends(get_db),
):
    """
    Server-authoritative creation of a Razorpay Order.
    Amount is strictly calculated from the database transaction record.
    Frontend amounts are ignored to prevent manipulation.
    """
    try:
        order_data = await razorpay_service.create_order_for_transaction(
            db=db,
            transaction_id=req.transaction_id,
        )
        return PaymentCreateOrderResponse(**order_data)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(exc)}",
        )


@router.post("/verify", response_model=PaymentResponse)
def verify_payment(
    req: PaymentVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Server-side HMAC-SHA256 signature verification for Razorpay Checkout response.
    Updates transaction status to 'Payment Successful' and logs audit event.
    """
    try:
        payment = razorpay_service.confirm_payment(
            db=db,
            transaction_id=req.transaction_id,
            order_id=req.razorpay_order_id,
            payment_id=req.razorpay_payment_id,
            signature=req.razorpay_signature,
        )
        return payment
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(exc)}",
        )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    """
    Server-to-server Razorpay asynchronous webhook endpoint.
    Verifies authenticity with RAZORPAY_WEBHOOK_SECRET and processes events idempotently.
    """
    raw_body = await request.body()
    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header.",
        )

    # Verify signature
    is_valid = razorpay_service.verify_webhook_signature(raw_body, x_razorpay_signature)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature.",
        )

    try:
        event_payload = await request.json()
        result = razorpay_service.process_webhook_event(db, event_payload)
        return {"status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}",
        )


@router.get("/{transaction_id}", response_model=Optional[PaymentResponse])
def get_payment_by_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve payment status and Razorpay identifiers for a specific transaction.
    """
    payment = (
        db.query(Payment)
        .filter(Payment.transaction_id == transaction_id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No payment record found for transaction #{transaction_id}",
        )
    return payment
