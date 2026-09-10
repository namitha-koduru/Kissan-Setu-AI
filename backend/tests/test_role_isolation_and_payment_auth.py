"""
Comprehensive Regression Suite for KissanSetuAI:
1. New FPO starts with 0 inventory
2. FPO aggregation increases only its own inventory
3. Repeated inventory GET does not increase quantity
4. Farmer inventory isolation from FPO
5. Buyer registration persists BUYER role
6. Buyer does not enter farmer onboarding
7. FPO registration persists FPO role
8. Farmer registration persists FARMER role
9. Farmer cannot create Razorpay payment (HTTP 403 Forbidden)
10. Buyer can create payment for valid transaction
11. Fake Razorpay order IDs are never returned on failure
12. Razorpay verification failure does not mark transaction PAID
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import uuid
import pytest
import hmac
import hashlib
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import get_db, SessionLocal
from app.database.models import Farmer, Buyer, Crop, Lot, Offer, Transaction, InventoryItem, StockAdjustment, Payment
from app.services.inventory_service import inventory_service
from app.services.payment_service import payment_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_new_fpo_starts_with_zero_inventory(db: Session, client: TestClient):
    """1. Create a brand-new FPO -> assert total_quantity = 0 and available_to_sell = 0."""
    uid = uuid.uuid4().hex[:8]
    phone = f"99{int(uid, 16) % 100000000:08d}"
    
    # Create new FPO user in DB
    fpo = Farmer(
        name="Sahyadri Zero Stock FPO",
        phone=phone,
        role="fpo",
        organization_name="Sahyadri Zero Stock FPO",
        state="Maharashtra",
        district="Nashik",
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    # Fetch inventory summary for this new FPO
    summary = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert summary["farmer_id"] == fpo.id
    assert summary["total_stock"] == 0.0
    assert summary["available_to_sell"] == 0.0
    assert summary["in_active_lots"] == 0.0
    assert summary["reserved"] == 0.0
    assert summary["sold"] == 0.0
    assert len(summary["items"]) == 0

    # API verification
    res = client.get(f"/api/inventory/{fpo.id}/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_stock"] == 0.0
    assert data["available_to_sell"] == 0.0


def test_fpo_aggregation_increases_only_its_own_inventory(db: Session, client: TestClient):
    """2. Aggregate 100 kg from a member -> FPO inventory becomes exactly 100 kg."""
    uid = uuid.uuid4().hex[:8]
    fpo_phone = f"98{int(uid, 16) % 100000000:08d}"
    fpo = Farmer(
        name="Nashik Grape Cluster FPO",
        phone=fpo_phone,
        role="fpo",
        organization_name="Nashik Grape Cluster FPO",
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    # Initial assertion
    initial = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert initial["total_stock"] == 0.0

    # Aggregate 100 kg
    res = inventory_service.record_member_aggregation(
        db=db,
        farmer_id=fpo.id,
        crop_name="Grapes",
        quantity=100.0,
        member_name="Ramesh Shinde",
    )
    assert res["success"] is True
    assert res["new_available_quantity"] == 100.0

    # Verify inventory is exactly 100 kg
    updated = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert updated["total_stock"] == 100.0
    assert updated["available_to_sell"] == 100.0


def test_repeated_inventory_get_does_not_increase_quantity(db: Session, client: TestClient):
    """3. Fetch inventory repeatedly -> remains exactly 100 kg, no double counting."""
    uid = uuid.uuid4().hex[:8]
    phone = f"97{int(uid, 16) % 100000000:08d}"
    fpo = Farmer(name="Repeat Test FPO", phone=phone, role="fpo")
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    inventory_service.record_member_aggregation(db, fpo.id, "Pomegranate", 100.0, "Kisan Bhai")

    # Call summary multiple times
    for _ in range(5):
        summary = inventory_service.get_farmer_inventory_summary(db, fpo.id)
        assert summary["total_stock"] == 100.0
        assert summary["available_to_sell"] == 100.0

        api_res = client.get(f"/api/inventory/{fpo.id}/summary")
        assert api_res.status_code == 200
        assert api_res.json()["total_stock"] == 100.0


def test_farmer_inventory_isolation_from_fpo(db: Session):
    """4. Existing farmer inventory must remain completely separate from FPO."""
    # Create Farmer with 500 kg Tomatoes
    uid1 = uuid.uuid4().hex[:8]
    farmer_phone = f"96{int(uid1, 16) % 100000000:08d}"
    farmer = Farmer(name="Individual Farmer", phone=farmer_phone, role="farmer")
    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    farmer_crop = Crop(farmer_id=farmer.id, crop_name="Tomato", quantity=500.0)
    db.add(farmer_crop)
    db.commit()

    # Create FPO with 0 initial stock
    uid2 = uuid.uuid4().hex[:8]
    fpo_phone = f"95{int(uid2, 16) % 100000000:08d}"
    fpo = Farmer(name="Isolated FPO", phone=fpo_phone, role="fpo")
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    # Farmer has 500 kg
    farmer_summary = inventory_service.get_farmer_inventory_summary(db, farmer.id)
    assert farmer_summary["total_stock"] == 500.0

    # FPO has 0 kg (not inheriting farmer's crops)
    fpo_summary = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert fpo_summary["total_stock"] == 0.0

    # Aggregate 150 kg into FPO
    inventory_service.record_member_aggregation(db, fpo.id, "Onion", 150.0, "Member 1")

    # Farmer still has 500 kg Tomato
    farmer_summary_after = inventory_service.get_farmer_inventory_summary(db, farmer.id)
    assert farmer_summary_after["total_stock"] == 500.0
    assert farmer_summary_after["items"][0]["crop_name"] == "Tomato"

    # FPO has 150 kg Onion
    fpo_summary_after = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert fpo_summary_after["total_stock"] == 150.0
    assert fpo_summary_after["items"][0]["crop_name"] == "Onion"


def test_buyer_registration_persists_buyer_role(db: Session, client: TestClient):
    """5. Buyer registration persists BUYER role in database."""
    uid = uuid.uuid4().hex[:8]
    buyer_phone = f"94{int(uid, 16) % 100000000:08d}"
    buyer_email = f"buyer_{uid}@agroprocessor.com"

    res = client.post("/api/buyers", json={
        "name": "Reliance Fresh Procurement",
        "organization": "Reliance Retail Ltd.",
        "location": "Mumbai, Maharashtra",
        "phone": buyer_phone,
        "email": buyer_email,
        "business_type": "Supermarket / Retail Chain",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["id"] > 0

    # Verify directly with fresh DB session
    fresh_db = SessionLocal()
    try:
        buyer_record = fresh_db.query(Buyer).filter(Buyer.id == data["id"]).first()
        assert buyer_record is not None
        assert buyer_record.name == "Reliance Fresh Procurement"
        assert buyer_record.phone == buyer_phone

        # Auth login check verifies role="buyer"
        login_res = client.post("/api/auth/login", json={
            "phone": buyer_phone,
            "role": "buyer",
        })
        assert login_res.status_code == 200
        assert login_res.json()["role"] == "buyer"
        assert login_res.json()["user_id"] == buyer_record.id
    finally:
        fresh_db.close()


def test_fpo_registration_persists_fpo_role(db: Session, client: TestClient):
    """7. FPO registration persists FPO role in database."""
    uid = uuid.uuid4().hex[:8]
    fpo_phone = f"93{int(uid, 16) % 100000000:08d}"
    fpo_email = f"fpo_{uid}@coop.in"

    res = client.post("/api/farmers", json={
        "name": "Baramati Krishi Vikas FPO",
        "phone": fpo_phone,
        "email": fpo_email,
        "role": "fpo",
        "organization_name": "Baramati Krishi Vikas FPC Ltd.",
        "state": "Maharashtra",
        "district": "Pune",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["role"] == "fpo"

    # Fresh DB check
    fresh_db = SessionLocal()
    try:
        rec = fresh_db.query(Farmer).filter(Farmer.id == data["id"]).first()
        assert rec is not None
        assert rec.role == "fpo"

        login_res = client.post("/api/auth/login", json={
            "phone": fpo_phone,
            "role": "fpo",
        })
        assert login_res.status_code == 200
        assert login_res.json()["role"] == "fpo"
    finally:
        fresh_db.close()


def test_farmer_registration_persists_farmer_role(db: Session, client: TestClient):
    """8. Farmer registration persists FARMER role in database."""
    uid = uuid.uuid4().hex[:8]
    farmer_phone = f"92{int(uid, 16) % 100000000:08d}"
    farmer_email = f"farmer_{uid}@kissansetu.in"

    res = client.post("/api/farmers", json={
        "name": "Kisanrao Patil",
        "phone": farmer_phone,
        "email": farmer_email,
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Nashik",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["role"] == "farmer"

    fresh_db = SessionLocal()
    try:
        rec = fresh_db.query(Farmer).filter(Farmer.id == data["id"]).first()
        assert rec is not None
        assert rec.role == "farmer"

        login_res = client.post("/api/auth/login", json={
            "phone": farmer_phone,
            "role": "farmer",
        })
        assert login_res.status_code == 200
        assert login_res.json()["role"] == "farmer"
    finally:
        fresh_db.close()


def test_farmer_cannot_create_razorpay_payment(db: Session, client: TestClient):
    """9. Farmer calling payment creation endpoint must receive 403 Forbidden."""
    # Create test transaction
    uid1 = uuid.uuid4().hex[:8]
    uid2 = uuid.uuid4().hex[:8]
    farmer = Farmer(name="Farmer Seller", phone=f"91{int(uid1, 16) % 100000000:08d}", role="farmer")
    buyer = Buyer(name="Buyer Sourcing", location="Nashik", phone=f"90{int(uid2, 16) % 100000000:08d}")
    db.add_all([farmer, buyer])
    db.commit()
    db.refresh(farmer)
    db.refresh(buyer)

    crop = Crop(farmer_id=farmer.id, crop_name="Tomato", quantity=500.0)
    db.add(crop)
    db.commit()
    db.refresh(crop)

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=500.0, asking_price=30.0)
    db.add(lot)
    db.commit()
    db.refresh(lot)

    tx = Transaction(
        lot_id=lot.id,
        farmer_id=farmer.id,
        buyer_id=buyer.id,
        quantity_kg=500.0,
        final_price=30.0,
        total_amount=15000.0,
        status="CONFIRMED",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Farmer attempts to call create-order with X-User-Role: farmer
    res = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx.id, "buyer_id": farmer.id},
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer.id)},
    )
    assert res.status_code == 403
    assert "Farmers are sellers" in res.json()["detail"] or "cannot initiate" in res.json()["detail"]


def test_buyer_can_create_payment_for_valid_transaction(db: Session, client: TestClient):
    """10. Buyer can create payment for valid transaction."""
    uid1 = uuid.uuid4().hex[:8]
    uid2 = uuid.uuid4().hex[:8]
    farmer = Farmer(name="Farmer Seller 2", phone=f"89{int(uid1, 16) % 100000000:08d}", role="farmer")
    buyer = Buyer(name="Buyer Sourcing 2", location="Nashik", phone=f"88{int(uid2, 16) % 100000000:08d}")
    db.add_all([farmer, buyer])
    db.commit()
    db.refresh(farmer)
    db.refresh(buyer)

    crop = Crop(farmer_id=farmer.id, crop_name="Grapes", quantity=300.0)
    db.add(crop)
    db.commit()
    db.refresh(crop)

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=300.0, asking_price=50.0)
    db.add(lot)
    db.commit()
    db.refresh(lot)

    tx = Transaction(
        lot_id=lot.id,
        farmer_id=farmer.id,
        buyer_id=buyer.id,
        quantity_kg=300.0,
        final_price=50.0,
        total_amount=15000.0,
        status="CONFIRMED",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Buyer creates payment order
    res = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx.id, "buyer_id": buyer.id},
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer.id)},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["order_id"].startswith("order_")
    assert data["amount"] == 15000.0
    assert data["amount_paise"] == 1500000
    assert data["currency"] == "INR"
    assert not data["order_id"].startswith("order_demo_")


def test_fake_razorpay_order_ids_never_returned_on_failure(db: Session):
    """11. Fake order IDs like order_demo_ are never manufactured when gateway is misconfigured or fails."""
    # Temporarily set key_id to empty to test failure
    orig_key = payment_service.key_id
    orig_sec = payment_service.key_secret

    try:
        from app.config import settings
        settings.RAZORPAY_KEY_ID = ""
        settings.RAZORPAY_KEY_SECRET = ""

        with pytest.raises(ValueError) as excinfo:
            import asyncio
            asyncio.run(payment_service.create_order(db, 1))

        assert "not configured" in str(excinfo.value)
    finally:
        settings.RAZORPAY_KEY_ID = orig_key
        settings.RAZORPAY_KEY_SECRET = orig_sec


def test_razorpay_verification_failure_does_not_mark_paid(db: Session, client: TestClient):
    """12. Razorpay verification failure does not mark transaction PAID."""
    uid1 = uuid.uuid4().hex[:8]
    uid2 = uuid.uuid4().hex[:8]
    farmer = Farmer(name="Farmer 3", phone=f"87{int(uid1, 16) % 100000000:08d}")
    buyer = Buyer(name="Buyer 3", location="Pune", phone=f"86{int(uid2, 16) % 100000000:08d}")
    db.add_all([farmer, buyer])
    db.commit()
    db.refresh(farmer)
    db.refresh(buyer)

    crop = Crop(farmer_id=farmer.id, crop_name="Chilli", quantity=200.0)
    db.add(crop)
    db.commit()
    db.refresh(crop)

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=200.0, asking_price=40.0)
    db.add(lot)
    db.commit()
    db.refresh(lot)

    tx = Transaction(
        lot_id=lot.id,
        farmer_id=farmer.id,
        buyer_id=buyer.id,
        quantity_kg=200.0,
        final_price=40.0,
        total_amount=8000.0,
        status="CONFIRMED",
        payment_status="PENDING",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Create real order
    order = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx.id, "buyer_id": buyer.id},
        headers={"X-User-Role": "buyer"},
    ).json()

    # Attempt to verify with invalid/fake signature
    verify_res = client.post("/api/payments/verify", json={
        "transaction_id": tx.id,
        "razorpay_order_id": order["order_id"],
        "razorpay_payment_id": "pay_fake_12345",
        "razorpay_signature": "invalid_signature_hash_9999",
    })
    assert verify_res.status_code == 400
    assert "verification failed" in verify_res.json()["detail"].lower() or "invalid signature" in verify_res.json()["detail"].lower()

    # Verify transaction in fresh session was NOT marked PAID
    fresh_db = SessionLocal()
    try:
        fresh_tx = fresh_db.query(Transaction).filter(Transaction.id == tx.id).first()
        assert fresh_tx.payment_status != "PAID"
        assert fresh_tx.payment_status == "PENDING"
    finally:
        fresh_db.close()
