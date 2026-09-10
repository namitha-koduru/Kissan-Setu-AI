"""
Tests for Production Database Persistence and Razorpay Payment Lifecycle.
Validates:
1. Real database persistence across fresh DB sessions (Farmer, Crop, Inventory, Lot, Offer, Transaction, FPO, Payment).
2. Safe diagnostics for /api/health and /api/payments/diagnostic without credential exposure.
3. Razorpay order creation, cryptographic HMAC signature verification, status transitions, and idempotent webhook processing.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import hmac
import hashlib
import json
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.config import settings
from app.database.connection import SessionLocal, get_db, check_database_health
from app.database.models import (
    Farmer,
    Crop,
    Lot,
    Offer,
    Buyer,
    Transaction,
    Payment,
    TransactionEvent,
    StockAdjustment,
)
from app.services.payment_service import payment_service
from app.services.inventory_service import inventory_service

client = TestClient(app)


# ==========================================
# PART 1: Safe Diagnostics & Health Audits
# ==========================================

def test_api_health_safe_diagnostics():
    """Verify /api/health returns database connectivity and safe diagnostic metadata without exposing secrets."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ok", "degraded"]
    assert "database" in data
    assert "database_connected" in data
    assert data["database_connected"] is True
    assert "database_type" in data
    assert "database_provider" in data
    assert data["select_1"] == "OK"
    assert "payments" in data
    assert "razorpay_configured" in data["payments"]
    assert "key_mode" in data["payments"]

    # Critical Security Assertion: Never leak secrets
    raw_text = res.text
    assert "postgres:" not in raw_text
    assert "password" not in raw_text.lower()
    if settings.RAZORPAY_KEY_SECRET:
        assert settings.RAZORPAY_KEY_SECRET not in raw_text
    if settings.RAZORPAY_WEBHOOK_SECRET:
        assert settings.RAZORPAY_WEBHOOK_SECRET not in raw_text


def test_payment_diagnostic_endpoint():
    """Verify /api/payments/diagnostic returns accurate non-sensitive configuration."""
    res = client.get("/api/payments/diagnostic")
    assert res.status_code == 200
    diag = res.json()
    assert "razorpay_configured" in diag
    assert "key_mode" in diag
    assert diag["key_mode"] in ["test", "live", "unconfigured"]
    assert "webhook_configured" in diag
    assert "database_connected" in diag
    assert diag["database_connected"] is True


# ==========================================
# PART 2: Database Real-World Persistence
# ==========================================

def test_complete_database_persistence_lifecycle():
    """
    Full Persistence Test:
    1. User/Farmer Signup
    2. Crop Registration & Inventory Initialization
    3. Lot Creation & Stock Allocation
    4. Buyer Offer Placement & Negotiation
    5. Offer Acceptance & Transaction Contract
    6. Razorpay Order Generation & DB Payment Record
    7. Signature Verification & Status Update to PAID
    8. Fresh DB Session verification for all records
    9. Clean deletion/rollback test
    """
    # 1. Create Farmer
    farmer_phone = f"99990{int(datetime.utcnow().timestamp()) % 100000:05d}"
    res_farmer = client.post("/api/farmers", json={
        "name": "Audit Test Farmer",
        "phone": farmer_phone,
        "email": f"farmer_{farmer_phone}@kissansetu.ai",
        "state": "Maharashtra",
        "district": "Nashik",
        "village": "Niphad",
        "role": "farmer",
    })
    assert res_farmer.status_code == 201
    farmer_id = res_farmer.json()["id"]

    # 2. Create Crop
    res_crop = client.post("/api/crops", json={
        "farmer_id": farmer_id,
        "crop_name": "Audit Tomato",
        "variety": "Abhinav",
        "acreage": 2.5,
        "quantity": 3000.0,
        "growth_stage": "Harvesting",
    })
    assert res_crop.status_code == 201
    crop_id = res_crop.json()["id"]

    # 3. Verify stock in new DB session
    fresh_db = SessionLocal()
    try:
        inv_summary = inventory_service.get_farmer_inventory_summary(fresh_db, farmer_id)
        assert any(i["crop_name"] == "Audit Tomato" and i["available_quantity"] == 3000.0 for i in inv_summary["items"])
    finally:
        fresh_db.close()

    # 4. Create Lot within available stock
    res_lot = client.post("/api/lots", json={
        "farmer_id": farmer_id,
        "crop_id": crop_id,
        "quantity": 1000.0,
        "asking_price": 25.0,
        "quality": "Grade A",
        "location": "Niphad, Nashik",
        "status": "Open for Offers",
    }, headers={"X-User-Role": "farmer"})
    assert res_lot.status_code == 201
    lot_id = res_lot.json()["id"]

    # 5. Create Buyer & Offer
    db_session = SessionLocal()
    try:
        buyer = db_session.query(Buyer).first()
        if not buyer:
            buyer = Buyer(name="Audit AgriCorp", location="Nashik", verified=True)
            db_session.add(buyer)
            db_session.commit()
            db_session.refresh(buyer)
        buyer_id = buyer.id
    finally:
        db_session.close()

    res_offer = client.post("/api/offers", json={
        "lot_id": lot_id,
        "buyer_id": buyer_id,
        "offered_price": 24.50,
        "quantity_kg": 1000.0,
        "quality_grade": "Grade A",
        "message": "Immediate farm-gate procurement.",
    })
    assert res_offer.status_code == 201
    offer_id = res_offer.json()["id"]

    # 6. Accept Offer -> Creates Transaction Contract
    res_accept = client.post(f"/api/offers/{offer_id}/accept")
    assert res_accept.status_code == 200
    tx_data = res_accept.json()
    tx_id = tx_data["id"]
    assert tx_data["status"] == "CONFIRMED"
    assert tx_data["total_amount"] == 24500.0

    # 7. Create Payment Order
    res_order = client.post("/api/payments/create-order", json={
        "transaction_id": tx_id,
        "buyer_id": buyer_id,
    })
    assert res_order.status_code == 200
    order_info = res_order.json()
    order_id = order_info["order_id"]
    assert order_info["amount"] == 24500.0
    assert order_info["amount_paise"] == 2450000

    # 8. Verify Payment with HMAC signature
    sim_payment_id = f"pay_test_{order_id[-8:]}"
    if payment_service.is_configured:
        expected_sig = hmac.new(
            payment_service.key_secret.encode("utf-8"),
            f"{order_id}|{sim_payment_id}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    else:
        expected_sig = f"sig_test_{order_id[-8:]}"

    res_verify = client.post("/api/payments/verify", json={
        "transaction_id": tx_id,
        "razorpay_order_id": order_id,
        "razorpay_payment_id": sim_payment_id,
        "razorpay_signature": expected_sig,
    })
    assert res_verify.status_code == 200
    assert res_verify.json()["status"] == "Payment Successful"

    # 9. Verify Persistence with a Fresh Independent DB Session
    verify_db = SessionLocal()
    try:
        persisted_farmer = verify_db.query(Farmer).filter(Farmer.id == farmer_id).first()
        assert persisted_farmer is not None
        assert persisted_farmer.phone == farmer_phone

        persisted_crop = verify_db.query(Crop).filter(Crop.id == crop_id).first()
        assert persisted_crop is not None
        assert persisted_crop.crop_name == "Audit Tomato"

        persisted_lot = verify_db.query(Lot).filter(Lot.id == lot_id).first()
        assert persisted_lot is not None
        assert persisted_lot.status == "ACCEPTED"

        persisted_tx = verify_db.query(Transaction).filter(Transaction.id == tx_id).first()
        assert persisted_tx is not None
        assert persisted_tx.payment_status == "PAID"
        assert persisted_tx.paid_amount == 24500.0
        assert persisted_tx.razorpay_payment_id == sim_payment_id

        persisted_pay = verify_db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        assert persisted_pay is not None
        assert persisted_pay.payment_status == "Payment Successful"
        assert persisted_pay.signature_verified is True

        # 10. Clean up test records
        verify_db.delete(persisted_farmer)  # Cascades to crops, lots, transactions, payments
        verify_db.commit()
    finally:
        verify_db.close()


# ==========================================
# PART 3: Razorpay Webhook Idempotency Audit
# ==========================================

def test_razorpay_webhook_processing_and_idempotency():
    """Verify asynchronous webhook events are verified and processed idempotently."""
    db = SessionLocal()
    try:
        # Create a test transaction and payment
        farmer = db.query(Farmer).first()
        farmer_id = farmer.id if farmer else 1
        crop = db.query(Crop).first()
        crop_id = crop.id if crop else 1

        lot = Lot(
            farmer_id=farmer_id,
            crop_id=crop_id,
            quantity=500.0,
            asking_price=20.0,
            status="ACCEPTED",
        )
        db.add(lot)
        db.flush()

        tx = Transaction(
            lot_id=lot.id,
            farmer_id=farmer_id,
            final_price=20.0,
            quantity_kg=500.0,
            total_amount=10000.0,
            status="CONFIRMED",
            payment_status="PENDING",
            expected_amount=10000.0,
        )
        db.add(tx)
        db.flush()

        order_id = f"order_webhook_test_{int(datetime.utcnow().timestamp())}"
        payment = Payment(
            transaction_id=tx.id,
            razorpay_order_id=order_id,
            payment_status="Payment Pending",
            amount=10000.0,
            currency="INR",
            webhook_status="PENDING",
        )
        db.add(payment)
        db.commit()

        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_hook_987654",
                        "order_id": order_id,
                        "amount": 1000000,
                        "status": "captured",
                    }
                }
            }
        }

        raw_bytes = json.dumps(webhook_payload).encode("utf-8")
        sig_hdr = None
        if payment_service.webhook_secret:
            sig_hdr = hmac.new(
                payment_service.webhook_secret.encode("utf-8"),
                raw_bytes,
                hashlib.sha256,
            ).hexdigest()

        # First webhook delivery -> Must succeed
        res_hook1 = payment_service.process_webhook_event(
            db=db,
            raw_body=raw_bytes,
            signature_header=sig_hdr,
            event_payload=webhook_payload,
        )
        assert res_hook1["status"] == "success"

        # Check payment record updated
        db.refresh(payment)
        assert payment.payment_status == "Payment Successful"
        assert payment.webhook_status == "VERIFIED"

        # Duplicate webhook delivery -> Must acknowledge idempotently without re-triggering
        res_hook2 = payment_service.process_webhook_event(
            db=db,
            raw_body=raw_bytes,
            signature_header=sig_hdr,
            event_payload=webhook_payload,
        )
        assert res_hook2["status"] == "already_processed"

        # Cleanup
        db.delete(lot)
        db.commit()
    finally:
        db.close()
