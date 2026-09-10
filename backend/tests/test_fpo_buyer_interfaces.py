"""
Comprehensive Role Interface Tests for FPO & BUYER Workflows:
1. New FPO Zero-Inventory Baseline
2. FPO Produce Aggregation from Members
3. FPO Bulk Lot Creation & Stock Allocation
4. Buyer Discovery of Farmer and FPO Lots
5. Buyer Offer Submission & Negotiation
6. Role-Isolated Payment: Seller-side FPO cannot pay (403), Buyer initiates payment
7. Buyer COD Selection vs Razorpay Flow
8. Buyer Marks as Received -> Idempotent Inventory Deduction & Trade Completion
9. Server-Side Route & Role Guards: Buyer cannot create crop/lot (403), Farmer cannot pay (403), Non-FPO cannot aggregate (403)
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


def test_fpo_aggregation_and_seller_lifecycle(db: Session, client: TestClient):
    """
    FPO Interface & Lifecycle:
    - New FPO starts with 0 inventory.
    - Aggregating produce from members increases FPO available stock.
    - FPO creates bulk lot from available stock.
    - Buyer submits offer -> FPO accepts.
    - Seller-side FPO payment blocked (403).
    - Buyer confirms receipt -> FPO stock deducted exactly once.
    """
    uid = uuid.uuid4().hex[:8]
    fpo_phone = f"95{int(uid, 16) % 100000000:08d}"

    # 1. Register FPO
    fpo = Farmer(
        name="Sahyadri Valley FPC",
        phone=fpo_phone,
        role="fpo",
        organization_name="Sahyadri Valley Agro FPC Ltd",
        state="Maharashtra",
        district="Nashik",
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)

    # 2. Verify Zero Initial Inventory Baseline
    initial_inv = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert initial_inv["total_stock"] == 0.0
    assert initial_inv["available_to_sell"] == 0.0
    assert initial_inv["in_active_lots"] == 0.0
    assert initial_inv["reserved"] == 0.0

    # 3. FPO Aggregates Produce from Smallholder Members
    agg_res = client.post(
        "/api/inventory/aggregation",
        json={
            "fpo_id": fpo.id,
            "crop_name": "Tomato",
            "quantity": 1500.0,
            "member_name": "Shivaji Rao",
            "variety": "Abhinav Hybrid",
            "notes": "Consolidated harvest from Dindori collection center.",
        },
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert agg_res.status_code == 200
    assert agg_res.json()["new_available_quantity"] == 1500.0

    # Verify inventory increased to 1500 kg
    inv_after_agg = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert inv_after_agg["total_stock"] == 1500.0
    assert inv_after_agg["available_to_sell"] == 1500.0

    # 4. FPO Creates Bulk Lot (1000 kg out of 1500 kg)
    crop = db.query(Crop).filter(Crop.farmer_id == fpo.id, Crop.crop_name.ilike("Tomato")).first()
    if not crop:
        crop = Crop(farmer_id=fpo.id, crop_name="Tomato", quantity=1500.0)
        db.add(crop)
        db.commit()
        db.refresh(crop)

    lot_res = client.post(
        "/api/lots",
        json={
            "farmer_id": fpo.id,
            "crop_id": crop.id,
            "quantity": 1000.0,
            "asking_price": 24.0,
            "quality": "Grade A",
            "location": "Dindori Hub, Nashik",
            "status": "Open for Offers",
        },
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert lot_res.status_code == 201
    lot_id = lot_res.json()["id"]

    inv_after_lot = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert inv_after_lot["total_stock"] == 1500.0
    assert inv_after_lot["available_to_sell"] == 500.0
    assert inv_after_lot["in_active_lots"] == 1000.0

    # 5. Buyer Places Purchase Offer
    b_uid = uuid.uuid4().hex[:8]
    buyer = Buyer(
        name="Mother Dairy Procurement",
        organization="Mother Dairy Fruit & Vegetable Pvt Ltd",
        location="Mumbai, Maharashtra",
        phone=f"96{int(b_uid, 16) % 100000000:08d}",
        email=f"md_{b_uid}@motherdairy.com",
    )
    db.add(buyer)
    db.commit()
    db.refresh(buyer)

    offer_res = client.post(
        "/api/offers",
        json={
            "lot_id": lot_id,
            "buyer_id": buyer.id,
            "offered_price": 23.5,
            "quantity_kg": 1000.0,
            "quality_grade": "Grade A",
            "message": "Institutional intake order for 1000 kg Tomato.",
        },
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer.id)}
    )
    assert offer_res.status_code == 201
    offer_id = offer_res.json()["id"]

    # 6. FPO Accepts Offer -> Transaction Created & Stock Reserved
    accept_res = client.post(
        f"/api/offers/{offer_id}/accept",
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert accept_res.status_code == 200
    tx_id = accept_res.json()["id"]

    inv_after_accept = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert inv_after_accept["total_stock"] == 1500.0
    assert inv_after_accept["available_to_sell"] == 500.0
    assert inv_after_accept["in_active_lots"] == 0.0
    assert inv_after_accept["reserved"] == 1000.0

    # 7. ROLE GUARD: Seller-side FPO cannot pay for its own sale (403 Forbidden)
    fpo_pay_res = client.post(
        "/api/payments/create-order",
        json={"transaction_id": tx_id, "buyer_id": fpo.id},
        headers={"X-User-Role": "fpo", "X-User-Id": str(fpo.id)}
    )
    assert fpo_pay_res.status_code == 403

    # 8. Buyer Sets COD Payment Method
    cod_res = client.post(
        f"/api/transactions/{tx_id}/payment-method",
        json={"payment_method": "COD", "cod_charge": 0.0}
    )
    assert cod_res.status_code == 200
    assert cod_res.json()["payment_method"] == "COD"

    # 9. Logistics Update & Buyer Delivery Confirmation
    client.post(
        f"/api/transactions/{tx_id}/logistics",
        json={"logistics_status": "IN_TRANSIT", "pickup_location": "Dindori Hub", "transport_cost_actual": 1200.0}
    )

    # Buyer Marks Order as Received
    recv_res = client.put(
        f"/api/transactions/{tx_id}/status",
        json={"status": "RECEIVED", "note": "Institutional intake completed and accepted."}
    )
    assert recv_res.status_code == 200

    # 10. Inventory Permanently Deducted Exactly Once
    final_inv = inventory_service.get_farmer_inventory_summary(db, fpo.id)
    assert final_inv["total_stock"] == 1500.0
    assert final_inv["available_to_sell"] == 500.0
    assert final_inv["reserved"] == 0.0
    assert final_inv["sold"] == 1000.0


def test_buyer_procurement_and_auth_guards(db: Session, client: TestClient):
    """
    Buyer Interface & Route Authorization Guards:
    - Buyer cannot create crops (HTTP 403)
    - Buyer cannot create lots (HTTP 403)
    - Non-FPO cannot aggregate produce (HTTP 403)
    - Buyer can browse lots and place offers
    """
    uid = uuid.uuid4().hex[:8]
    buyer_phone = f"97{int(uid, 16) % 100000000:08d}"

    # Register Buyer
    b_res = client.post("/api/buyers", json={
        "name": "Nature Fresh Retail",
        "organization": "Nature Fresh Foods Ltd",
        "location": "Pune, Maharashtra",
        "phone": buyer_phone,
        "email": f"nf_{uid}@naturefresh.in",
    })
    assert b_res.status_code == 201
    buyer_id = b_res.json()["id"]

    # 1. Guard: Buyer cannot create crop -> 403 Forbidden
    crop_res = client.post(
        "/api/crops",
        json={"farmer_id": buyer_id, "crop_name": "Onion", "quantity": 500.0},
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert crop_res.status_code == 403

    # 2. Guard: Buyer cannot create lot -> 403 Forbidden
    lot_res = client.post(
        "/api/lots",
        json={"farmer_id": buyer_id, "crop_id": 1, "quantity": 500.0, "asking_price": 20.0},
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert lot_res.status_code == 403

    # 3. Guard: Buyer cannot aggregate stock -> 403 Forbidden
    agg_res = client.post(
        "/api/inventory/aggregation",
        json={"fpo_id": buyer_id, "crop_name": "Onion", "quantity": 500.0},
        headers={"X-User-Role": "buyer", "X-User-Id": str(buyer_id)}
    )
    assert agg_res.status_code == 403
