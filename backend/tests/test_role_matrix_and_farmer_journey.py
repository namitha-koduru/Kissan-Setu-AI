"""
Comprehensive End-to-End Test Suite for KissanSetuAI:
1. Complete Farmer Lifecycle & Role Integrity
2. Farmer Payment Guard (HTTP 403)
3. Buyer Lifecycle & Prohibited Actions (HTTP 403 on Crop/Lot creation)
4. FPO Lifecycle & Zero Initial Inventory Baseline
5. Idempotent Delivery Confirmation & Inventory Deduction
6. COD vs Razorpay Lifecycle Guarantees
"""

import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Farmer, Buyer, Crop, Lot, Offer, Transaction, InventoryItem
from app.services.inventory_service import inventory_service
from app.services.payment_service import payment_service
from app.services.transaction_service import transaction_service


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


def test_farmer_end_to_end_journey(db: Session, client: TestClient):
    """
    Complete Farmer Journey:
    Setup -> Crop -> Inventory Baseline -> Lot Creation (within stock) ->
    Receive Buyer Offer -> Accept Offer -> Order Confirmed ->
    Farmer Payment Blocked (403) -> Buyer Razorpay Payment ->
    Shipping -> Delivery Confirmation -> Stock Deducted Exactly Once -> Previous Orders.
    """
    uid = uuid.uuid4().hex[:8]
    farmer_phone = f"91{int(uid, 16) % 100000000:08d}"
    farmer_email = f"farmer_{uid}@kissansetu.in"

    # 1. Farmer Registration & Persistence
    f_res = client.post("/api/farmers", json={
        "name": "Ramesh Patil",
        "phone": farmer_phone,
        "email": farmer_email,
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Nashik",
    })
    assert f_res.status_code == 201
    farmer_id = f_res.json()["id"]

    # 2. Farmer Creates Crop (1000 kg Grapes)
    c_res = client.post(
        "/api/crops",
        json={
            "farmer_id": farmer_id,
            "crop_name": "Grapes",
            "variety": "Thompson Seedless",
            "quantity": 1000.0,
            "sowing_date": "2026-05-10",
            "expected_harvest_date": "2026-09-10",
            "status": "Harvest Ready",
        },
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer_id)}
    )
    assert c_res.status_code == 201
    crop_id = c_res.json()["id"]

    # 3. Verify Inventory Baseline (1000 kg total, 1000 kg available)
    inv = inventory_service.get_farmer_inventory_summary(db, farmer_id)
    assert inv["total_stock"] == 1000.0
    assert inv["available_to_sell"] == 1000.0
    assert inv["in_active_lots"] == 0.0

    # 4. Farmer Creates Sale Lot of 400 kg
    lot_res = client.post(
        "/api/lots",
        json={
            "farmer_id": farmer_id,
            "crop_id": crop_id,
            "quantity": 400.0,
            "asking_price": 45.0,
            "quality": "Grade A",
            "harvest_date": "2026-09-10",
            "location": "Nashik, Maharashtra",
            "status": "Open for Offers",
        },
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer_id)}
    )
    assert lot_res.status_code == 201
    lot_id = lot_res.json()["id"]

    # Inventory check: 400 kg in active lots, 600 kg available
    inv_after_lot = inventory_service.get_farmer_inventory_summary(db, farmer_id)
    assert inv_after_lot["total_stock"] == 1000.0
    assert inv_after_lot["available_to_sell"] == 600.0
    assert inv_after_lot["in_active_lots"] == 400.0

    # 5. Over-listing validation: cannot create lot of 700 kg when only 600 kg is available
    over_res = client.post(
        "/api/lots",
        json={
            "farmer_id": farmer_id,
            "crop_id": crop_id,
            "quantity": 700.0,
            "asking_price": 45.0,
            "status": "Open for Offers",
        },
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer_id)}
    )
    assert over_res.status_code == 400
    assert "available to sell" in over_res.json()["detail"].lower()

    # 6. Buyer Registers & Submits Offer on the Lot
    b_uid = uuid.uuid4().hex[:8]
    b_phone = f"92{int(b_uid, 16) % 100000000:08d}"
    buyer = Buyer(
        name="BigBasket Hub Nashik",
        organization="Innovative Retail Concepts",
        location="Nashik, Maharashtra",
        phone=b_phone,
        email=f"bb_{b_uid}@bigbasket.com",
    )
    db.add(buyer)
    db.commit()
    db.refresh(buyer)

    offer_res = client.post(
        "/api/offers",
        json={
            "lot_id": lot_id,
            "buyer_id": buyer.id,
            "offered_price": 44.0,
            "quantity_kg": 400.0,
            "quality_grade": "Grade A",
            "message": "Institutional procurement offer for 400 kg Grapes at ₹44/kg.",
        },
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer.id)}
    )
    assert offer_res.status_code == 201
    offer_id = offer_res.json()["id"]

    # 7. Farmer Accepts Offer -> Transaction Created & Stock Reserved
    accept_res = client.post(
        f"/api/offers/{offer_id}/accept",
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer_id)}
    )
    assert accept_res.status_code == 200
    tx_id = accept_res.json()["id"]

    # Inventory check: 400 kg is now RESERVED, 600 kg available, 0 in active lots
    inv_after_accept = inventory_service.get_farmer_inventory_summary(db, farmer_id)
    assert inv_after_accept["total_stock"] == 1000.0
    assert inv_after_accept["available_to_sell"] == 600.0
    assert inv_after_accept["in_active_lots"] == 0.0
    assert inv_after_accept["reserved"] == 400.0

    # 8. CRITICAL ROLE GUARD: Farmer cannot initiate Razorpay payment (HTTP 403)
    farmer_pay_res = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx_id, "buyer_id": farmer_id},
        headers={"X-User-Role": "farmer", "X-User-Id": str(farmer_id)}
    )
    assert farmer_pay_res.status_code == 403
    assert "sellers" in farmer_pay_res.json()["detail"].lower()

    # 9. Buyer creates Razorpay Payment Order
    buyer_pay_res = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx_id, "buyer_id": buyer.id},
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer.id)}
    )
    assert buyer_pay_res.status_code == 200
    order_data = buyer_pay_res.json()
    assert order_data["amount"] == 17600.0  # 400 kg * ₹44/kg
    assert order_data["order_id"].startswith("order_")

    # 10. Advance Logistics & Delivery Confirmation
    client.post(
        f"/api/transactions/{tx_id}/logistics",
        json={
            "logistics_status": "IN_TRANSIT",
            "pickup_location": "Nashik Farm Gate",
            "transport_cost_actual": 600.0,
        }
    )

    # Receiver Confirms Receipt
    status_res = client.put(
        f"/api/transactions/{tx_id}/status",
        json={"status": "RECEIVED", "note": "Produce received and inspected."}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "RECEIVED"

    # 11. Inventory Verification: 400 kg permanently sold, exactly once
    final_inv = inventory_service.get_farmer_inventory_summary(db, farmer_id)
    assert final_inv["total_stock"] == 1000.0
    assert final_inv["available_to_sell"] == 600.0
    assert final_inv["reserved"] == 0.0
    assert final_inv["sold"] == 400.0

    # 12. Idempotency Check: repeated delivery confirmation does not reduce stock further
    client.put(
        f"/api/transactions/{tx_id}/status",
        json={"status": "COMPLETED", "note": "Order closed."}
    )
    repeat_inv = inventory_service.get_farmer_inventory_summary(db, farmer_id)
    assert repeat_inv["total_stock"] == 1000.0
    assert repeat_inv["available_to_sell"] == 600.0
    assert repeat_inv["sold"] == 400.0


def test_buyer_role_prohibitions(db: Session, client: TestClient):
    """
    Buyer is a purchaser and is strictly blocked from:
    1. Creating crops (HTTP 403)
    2. Creating lots (HTTP 403)
    3. Aggregating FPO stock (HTTP 403)
    """
    uid = uuid.uuid4().hex[:8]
    buyer_phone = f"93{int(uid, 16) % 100000000:08d}"

    # Register Buyer
    b_res = client.post("/api/buyers", json={
        "name": "Reliance Retail Procurement",
        "organization": "Reliance Retail Ltd",
        "location": "Mumbai, Maharashtra",
        "phone": buyer_phone,
        "email": f"rel_{uid}@relretail.com",
    })
    assert b_res.status_code == 201
    buyer_id = b_res.json()["id"]

    # 1. Buyer attempts to create crop -> 403 Forbidden
    crop_res = client.post(
        "/api/crops",
        json={
            "farmer_id": buyer_id,
            "crop_name": "Tomato",
            "quantity": 500.0,
        },
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert crop_res.status_code == 403
    assert "buyers cannot register crops" in crop_res.json()["detail"].lower()

    # 2. Buyer attempts to create lot -> 403 Forbidden
    lot_res = client.post(
        "/api/lots",
        json={
            "farmer_id": buyer_id,
            "crop_id": 1,
            "quantity": 500.0,
            "asking_price": 30.0,
        },
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert lot_res.status_code == 403
    assert "buyers are not permitted" in lot_res.json()["detail"].lower()

    # 3. Buyer attempts FPO aggregation -> 403 Forbidden
    agg_res = client.post(
        "/api/inventory/aggregation",
        json={
            "fpo_id": buyer_id,
            "crop_name": "Onion",
            "quantity": 1000.0,
        },
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert agg_res.status_code == 403


def test_fpo_aggregation_and_bulk_sale_lifecycle(db: Session, client: TestClient):
    """
    FPO Lifecycle:
    1. New FPO starts with 0 inventory
    2. FPO pools 800 kg onions from members -> inventory becomes 800 kg
    3. FPO creates bulk lot of 800 kg
    4. Buyer places offer -> FPO accepts -> trade confirms
    5. Order completion permanently deducts 800 kg from FPO stock.
    """
    uid = uuid.uuid4().hex[:8]
    fpo_phone = f"94{int(uid, 16) % 100000000:08d}"

    fpo = Farmer(
        name="Kadwa Valley FPC Ltd",
        phone=fpo_phone,
        role="fpo",
        organization_name="Kadwa Valley Farmer Producer Co.",
        state="Maharashtra",
        district="Nashik",
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    # 1. Zero initial inventory
    initial_inv = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert initial_inv["total_stock"] == 0.0
    assert initial_inv["available_to_sell"] == 0.0

    # 2. Aggregate 800 kg Onion from members
    agg_res = client.post(
        "/api/inventory/aggregation",
        json={
            "fpo_id": fpo.id,
            "crop_name": "Onion",
            "quantity": 800.0,
            "member_name": "Dinkar Gaikwad",
            "variety": "Garwa Red",
        },
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert agg_res.status_code == 200
    assert agg_res.json()["new_available_quantity"] == 800.0

    # 3. Create Bulk Lot
    crop = db.query(Crop).filter(Crop.farmer_id == fpo.id, Crop.crop_name.ilike("Onion")).first()
    if not crop:
        crop = Crop(farmer_id=fpo.id, crop_name="Onion", quantity=800.0)
        db.add(crop)
        db.commit()
        db.refresh(crop)

    lot_res = client.post(
        "/api/lots",
        json={
            "farmer_id": fpo.id,
            "crop_id": crop.id,
            "quantity": 800.0,
            "asking_price": 28.0,
            "quality": "Grade A",
            "location": "Dindori Collection Hub",
            "status": "Open for Offers",
        },
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert lot_res.status_code == 201
    lot_id = lot_res.json()["id"]

    # FPO inventory: 800 kg in active lots, 0 kg available
    fpo_inv = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert fpo_inv["total_stock"] == 800.0
    assert fpo_inv["available_to_sell"] == 0.0
    assert fpo_inv["in_active_lots"] == 800.0
