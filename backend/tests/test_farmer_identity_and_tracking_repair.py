import sys
import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base, get_db
from app.database.models import Farmer, Buyer, Crop, Lot, Transaction, Offer

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_farmer_registration_and_crop_creation(client):
    # 1. Register a new genuine farmer
    reg_payload = {
        "phone": "9876543210",
        "name": "Ramesh Patel",
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Nashik",
        "village": "Pimpalgaon",
    }
    reg_resp = client.post("/api/farmers", json=reg_payload)
    assert reg_resp.status_code == 201, reg_resp.text
    user_data = reg_resp.json()
    farmer_id = user_data["id"]
    assert isinstance(farmer_id, int)
    assert farmer_id > 0
    assert farmer_id < 1_000_000_000, "Farmer ID must be a genuine database sequence, not a timestamp"

    # 2. Create crop with the genuine farmer ID
    crop_payload = {
        "farmer_id": farmer_id,
        "crop_name": "Tomato",
        "variety": "Hybrid Red",
        "acreage": 2.0,
        "quantity": 5000.0,
        "sowing_date": "2026-06-15",
        "expected_harvest_date": "2026-09-25",
        "growth_stage": "Near maturity",
    }
    crop_resp = client.post("/api/crops", json=crop_payload)
    assert crop_resp.status_code == 201, crop_resp.text
    crop_data = crop_resp.json()
    assert crop_data["farmer_id"] == farmer_id
    assert crop_data["crop_name"] == "Tomato"

    # 3. Attempt crop creation with invalid timestamp-like ID (e.g. 1788729515143)
    bad_crop_payload = {
        "farmer_id": 1788729515143,
        "crop_name": "Onion",
        "variety": "Nasik Red",
        "acreage": 1.0,
        "quantity": 2000.0,
    }
    bad_crop_resp = client.post("/api/crops", json=bad_crop_payload)
    assert bad_crop_resp.status_code == 404
    assert "Farmer with ID 1788729515143 does not exist" in bad_crop_resp.json()["detail"]

def test_lot_creation_and_cross_farmer_ownership_check(client):
    # 1. Register Farmer A
    fa_resp = client.post("/api/farmers", json={
        "phone": "9811111111",
        "name": "Farmer Alpha",
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Pune",
    })
    assert fa_resp.status_code == 201, fa_resp.text
    fa_id = fa_resp.json()["id"]

    # 2. Register Farmer B
    fb_resp = client.post("/api/farmers", json={
        "phone": "9822222222",
        "name": "Farmer Beta",
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Satara",
    })
    assert fb_resp.status_code == 201, fb_resp.text
    fb_id = fb_resp.json()["id"]

    # 3. Create Crop for Farmer A
    crop_a_resp = client.post("/api/crops", json={
        "farmer_id": fa_id,
        "crop_name": "Wheat",
        "variety": "Sharbati",
        "acreage": 3.0,
        "quantity": 4000.0,
    })
    assert crop_a_resp.status_code == 201, crop_a_resp.text
    crop_a_id = crop_a_resp.json()["id"]

    # 4. Farmer A creates Lot for Crop A -> Should succeed
    lot_a_resp = client.post("/api/lots", json={
        "crop_id": crop_a_id,
        "farmer_id": fa_id,
        "quantity": 1500.0,
        "asking_price": 28.5,
        "quality": "Grade A",
    })
    assert lot_a_resp.status_code == 201, lot_a_resp.text
    lot_a_id = lot_a_resp.json()["id"]

    # 5. Farmer B attempts to create Lot referencing Farmer A's Crop -> Must fail 403 Forbidden
    lot_b_resp = client.post("/api/lots", json={
        "crop_id": crop_a_id,
        "farmer_id": fb_id,
        "quantity": 1000.0,
        "asking_price": 30.0,
        "quality": "Grade A",
    })
    assert lot_b_resp.status_code == 403
    assert "does not belong to the authenticated farmer" in lot_b_resp.json()["detail"]

    # 6. Verify lot listing for Farmer A returns 1 lot, and for Farmer B returns 0 lots
    list_a = client.get(f"/api/lots?farmer_id={fa_id}").json()
    assert len(list_a) == 1
    assert list_a[0]["id"] == lot_a_id

    list_b = client.get(f"/api/lots?farmer_id={fb_id}").json()
    assert len(list_b) == 0

def test_order_tracking_query_and_role_based_receiving(client):
    # 1. Setup Farmer, Buyer, Crop, and Lot
    f_resp = client.post("/api/farmers", json={
        "phone": "9833333333",
        "name": "Kishan Kumar",
        "role": "farmer",
        "state": "Maharashtra",
        "district": "Nashik",
    })
    assert f_resp.status_code == 201, f_resp.text
    farmer_id = f_resp.json()["id"]

    b_resp = client.post("/api/buyers", json={
        "phone": "9844444444",
        "name": "Reliance Fresh Procurement",
        "location": "Mumbai, Maharashtra",
        "business_type": "Enterprise Buyer",
    })
    assert b_resp.status_code == 201, b_resp.text
    buyer_id = b_resp.json()["id"]

    crop_resp = client.post("/api/crops", json={
        "farmer_id": farmer_id,
        "crop_name": "Capsicum",
        "variety": "Green Bell",
        "acreage": 1.5,
        "quantity": 3000.0,
    })
    assert crop_resp.status_code == 201, crop_resp.text
    crop_id = crop_resp.json()["id"]

    lot_resp = client.post("/api/lots", json={
        "crop_id": crop_id,
        "farmer_id": farmer_id,
        "quantity": 1000.0,
        "asking_price": 45.0,
        "quality": "Grade A",
    })
    assert lot_resp.status_code == 201, lot_resp.text
    lot_id = lot_resp.json()["id"]

    # 2. Create Offer & Accept it to generate Transaction
    offer_resp = client.post("/api/offers", json={
        "lot_id": lot_id,
        "buyer_id": buyer_id,
        "offered_price": 45.0,
        "quantity": 1000.0,
        "status": "Pending",
    })
    assert offer_resp.status_code == 201, offer_resp.text
    offer_id = offer_resp.json()["id"]

    accept_resp = client.post(f"/api/offers/{offer_id}/accept")
    assert accept_resp.status_code == 200, accept_resp.text
    tx_data = accept_resp.json()
    tx_id = tx_data["id"]

    # 3. Query transactions by farmer_id
    tx_list = client.get(f"/api/transactions?farmer_id={farmer_id}").json()
    assert len(tx_list) == 1
    assert tx_list[0]["id"] == tx_id
    assert tx_list[0]["final_price"] == 45.0

    # 4. Check an unrelated fresh farmer has 0 transactions
    other_tx_list = client.get("/api/transactions?farmer_id=9999").json()
    assert len(other_tx_list) == 0

    # 5. Farmer attempts to mark as RECEIVED -> Forbidden (403)
    farmer_rcv_resp = client.put(
        f"/api/transactions/{tx_id}/status",
        headers={"X-User-Role": "farmer"},
        json={
            "status": "RECEIVED",
            "note": "Farmer attempting to self-mark delivery received",
        },
    )
    assert farmer_rcv_resp.status_code == 403
    assert "cannot mark orders as received" in farmer_rcv_resp.json()["detail"]

    # 6. Buyer marks as RECEIVED -> Allowed (200)
    buyer_rcv_resp = client.put(
        f"/api/transactions/{tx_id}/status",
        headers={"X-User-Role": "buyer"},
        json={
            "status": "RECEIVED",
            "note": "Produce received, weighed, and verified by buyer warehouse",
        },
    )
    assert buyer_rcv_resp.status_code == 200
    updated_tx = buyer_rcv_resp.json()
    assert updated_tx["status"] == "RECEIVED"
    assert updated_tx["logistics_status"] == "DELIVERED"
