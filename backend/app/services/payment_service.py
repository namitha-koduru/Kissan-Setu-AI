"""
Razorpay Payment Gateway Service for KissanSetuAI.
Authoritative server-side order creation, HMAC-SHA256 signature verification, and idempotent webhook processing.
"""

import hmac
import hashlib
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.database.models import Transaction, Payment, TransactionEvent

logger = logging.getLogger("kissansetu.payment")


class RazorpayPaymentService:
    def __init__(self):
        self.base_url = "https://api.razorpay.com/v1"
        self.timeout = 20.0

    @property
    def key_id(self) -> str:
        return (settings.RAZORPAY_KEY_ID or "").strip()

    @property
    def key_secret(self) -> str:
        return (settings.RAZORPAY_KEY_SECRET or "").strip()

    @property
    def webhook_secret(self) -> str:
        return (settings.RAZORPAY_WEBHOOK_SECRET or "").strip()

    @property
    def is_configured(self) -> bool:
        """Checks if live or valid test Razorpay credentials are set."""
        k_id = self.key_id
        k_sec = self.key_secret
        return bool(k_id and k_sec and not k_id.startswith("rzp_test_placeholder") and len(k_sec) >= 8)

    def get_diagnostics(self) -> Dict[str, Any]:
        """Returns safe diagnostic info without exposing secret keys."""
        k_id = self.key_id
        is_conf = self.is_configured
        key_mode = "unconfigured"
        if k_id.startswith("rzp_live_"):
            key_mode = "live"
        elif k_id.startswith("rzp_test_"):
            key_mode = "test"
        
        return {
            "razorpay_configured": is_conf,
            "key_mode": key_mode,
            "key_prefix": k_id[:8] if is_conf else "none",
            "webhook_configured": bool(self.webhook_secret),
            "status": "ready" if is_conf else "demo_mode",
        }

    async def create_order(
        self,
        db: Session,
        transaction_id: int,
        buyer_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Creates a server-authoritative Razorpay Order for a verified Transaction.
        Amount is calculated strictly from transaction state, never trusted from client.
        """
        # 1. Authoritative Transaction lookup
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise ValueError(f"Transaction #{transaction_id} not found.")

        # 2. Compute authoritative amount
        if tx.total_amount and tx.total_amount > 0:
            authoritative_amount = float(tx.total_amount)
        elif tx.quantity_kg and tx.final_price:
            authoritative_amount = float(tx.quantity_kg * tx.final_price)
        else:
            raise ValueError("Transaction financial details are incomplete or invalid.")

        payable_amount = authoritative_amount
        amount_paise = int(round(payable_amount * 100))
        receipt_ref = f"rcpt_tx_{tx.id}_{int(datetime.utcnow().timestamp())}"

        order_id = ""
        is_test_mode = not self.is_configured

        # 3. Attempt real Razorpay API order creation if configured
        if self.is_configured:
            auth = (self.key_id, self.key_secret)
            payload = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_ref,
                "notes": {
                    "transaction_id": str(tx.id),
                    "lot_id": str(tx.lot_id),
                    "buyer_id": str(tx.buyer_id or buyer_id or ""),
                },
            }
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(f"{self.base_url}/orders", json=payload, auth=auth)
                    if resp.status_code in [200, 201]:
                        order_data = resp.json()
                        order_id = order_data["id"]
                    else:
                        err_text = resp.text
                        logger.error(f"[Razorpay API Error] {resp.status_code}: {err_text}")
                        raise ValueError(f"Razorpay order creation rejected by gateway ({resp.status_code}): {err_text}")
            except httpx.RequestError as req_err:
                logger.error(f"[Razorpay Network Error] {req_err}")
                raise ValueError(f"Failed to connect to Razorpay payment gateway: {str(req_err)}")
        else:
            # Local/Demo test mode fallback
            order_id = f"order_demo_{uuid.uuid4().hex[:14]}"
            is_test_mode = True

        # 4. Persist Payment Record in Database
        payment = Payment(
            transaction_id=tx.id,
            razorpay_order_id=order_id,
            payment_status="Payment Pending",
            amount=payable_amount,
            currency="INR",
            created_at=datetime.utcnow(),
            signature_verified=False,
            webhook_status="PENDING",
        )
        db.add(payment)
        
        # Link order to transaction
        tx.razorpay_order_id = order_id
        db.commit()
        db.refresh(payment)

        return {
            "order_id": order_id,
            "key_id": self.key_id if self.is_configured else "rzp_test_demo_mode",
            "amount": payable_amount,
            "amount_paise": amount_paise,
            "currency": "INR",
            "transaction_id": tx.id,
            "is_test_mode": is_test_mode,
            "receipt": receipt_ref,
        }

    def verify_payment_signature(
        self,
        db: Session,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verifies HMAC-SHA256 signature server-side before confirming payment authenticity.
        Signature: hmac_sha256(order_id + "|" + payment_id, secret)
        """
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if not payment:
            return False, {"error": "Payment order reference not found in database."}

        tx = db.query(Transaction).filter(Transaction.id == payment.transaction_id).first()
        if not tx:
            return False, {"error": "Associated transaction not found."}

        is_valid = False

        if self.is_configured:
            # Genuine cryptographic signature verification
            try:
                msg = f"{order_id}|{payment_id}".encode("utf-8")
                expected_signature = hmac.new(
                    self.key_secret.encode("utf-8"),
                    msg,
                    hashlib.sha256,
                ).hexdigest()
                is_valid = hmac.compare_digest(expected_signature, signature)
            except Exception as e:
                logger.error(f"[Razorpay] Signature verification exception: {e}")
                is_valid = False
        else:
            # Demo / Test Mode Verification
            is_valid = bool(payment_id and signature and order_id)

        if not is_valid:
            payment.payment_status = "Payment Failed"
            payment.failure_reason = "HMAC SHA-256 signature verification failed."
            db.commit()
            return False, {"error": "Invalid signature. Payment could not be verified."}

        # Update Payment Record
        payment.razorpay_payment_id = payment_id
        payment.payment_status = "Payment Successful"
        payment.signature_verified = True
        payment.paid_at = datetime.utcnow()

        # Update Transaction Record
        tx.payment_status = "PAID"
        tx.paid_amount = payment.amount
        tx.payment_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        tx.payment_reference = payment_id
        tx.razorpay_payment_id = payment_id
        tx.razorpay_signature = signature

        # Add timeline event
        event = TransactionEvent(
            transaction_id=tx.id,
            stage_label="Payment Completed & Verified",
            description=f"Buyer completed payment of ₹{payment.amount:,.2f} via Razorpay (Payment ID: {payment_id})",
            done=True,
            created_at=datetime.utcnow(),
        )
        db.add(event)
        db.commit()
        db.refresh(payment)
        db.refresh(tx)

        return True, {
            "status": "Payment Successful",
            "transaction_id": tx.id,
            "order_id": order_id,
            "payment_id": payment_id,
            "amount": payment.amount,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else datetime.utcnow().isoformat(),
        }

    def process_webhook_event(
        self,
        db: Session,
        raw_body: bytes,
        signature_header: Optional[str],
        event_payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Idempotently processes asynchronous Razorpay server-to-server webhook notifications.
        Validates authenticity using RAZORPAY_WEBHOOK_SECRET.
        """
        # 1. Authenticate webhook if secret is set
        if self.webhook_secret:
            if not signature_header:
                raise ValueError("Missing X-Razorpay-Signature header.")
            expected_sig = hmac.new(
                self.webhook_secret.encode("utf-8"),
                raw_body,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected_sig, signature_header):
                raise ValueError("Invalid webhook signature.")

        event_name = event_payload.get("event", "")
        payload_data = event_payload.get("payload", {})

        logger.info(f"[Razorpay Webhook] Received event: {event_name}")

        # Extract payment & order entities
        payment_entity = payload_data.get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id") or payload_data.get("order", {}).get("entity", {}).get("id")
        payment_id = payment_entity.get("id")

        if not order_id:
            return {"status": "ignored", "reason": "No order_id in webhook payload"}

        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if not payment:
            logger.warning(f"[Razorpay Webhook] Order {order_id} not found in database.")
            return {"status": "ignored", "reason": f"Order {order_id} not found"}

        # Idempotency check: If already marked successful, acknowledge without re-executing
        if payment.payment_status == "Payment Successful" and event_name in ["order.paid", "payment.captured"]:
            payment.webhook_status = "VERIFIED"
            db.commit()
            return {"status": "already_processed", "order_id": order_id}

        if event_name in ["order.paid", "payment.captured"]:
            payment.payment_status = "Payment Successful"
            payment.razorpay_payment_id = payment_id or payment.razorpay_payment_id
            payment.paid_at = datetime.utcnow()
            payment.webhook_status = "VERIFIED"

            tx = db.query(Transaction).filter(Transaction.id == payment.transaction_id).first()
            if tx:
                tx.payment_status = "PAID"
                tx.paid_amount = payment.amount
                tx.payment_reference = payment_id or tx.payment_reference
                tx.razorpay_payment_id = payment_id or tx.razorpay_payment_id

            db.commit()
            return {"status": "success", "event": event_name, "order_id": order_id}

        elif event_name in ["payment.failed"]:
            payment.payment_status = "Payment Failed"
            payment.failure_reason = payment_entity.get("error_description", "Payment failed at checkout.")
            payment.webhook_status = "DELIVERED"
            db.commit()
            return {"status": "payment_failed_recorded", "order_id": order_id}

        return {"status": "unhandled_event", "event": event_name}


payment_service = RazorpayPaymentService()

