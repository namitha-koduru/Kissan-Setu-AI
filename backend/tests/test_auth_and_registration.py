import sys
import os
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_farmer_login_existing_and_new():
    # 1. Existing seed farmer login
    res = client.post("/api/auth/login", json={"phone": "+91 98765 43210", "password": "securepassword123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["farmer"]["name"] == "Ramesh Kumar"
    assert data["farmer"]["district"] == "Nashik"

    # 2. Dynamic farmer creation on new phone login in development mode
    new_phone = f"+91 91{uuid.uuid4().int % 100000000:08d}"
    res2 = client.post("/api/auth/login", json={"phone": new_phone, "password": "anotherpassword"})
    assert res2.status_code == 200
    data2 = res2.json()
    from app.services.auth_validation import normalize_mobile
    assert data2["farmer"]["phone"] == normalize_mobile(new_phone)


def test_auth_me_endpoint():
    res = client.get("/api/auth/me?farmer_id=1")
    assert res.status_code == 200
    farmer = res.json()
    assert farmer["id"] == 1
    assert farmer["name"] == "Ramesh Kumar"


def test_auth_invalid_farmer_id_me():
    res = client.get("/api/auth/me?farmer_id=99999")
    assert res.status_code == 404


def test_farmer_crud_and_pan_india_profile():
    # Test creating farmer with non-Maharashtra PAN-India state (e.g. Punjab, Rajasthan, Andhra Pradesh)
    uid = uuid.uuid4().hex[:6]
    punjab_farmer = {
        "name": f"Gurpreet Singh {uid}",
        "phone": f"+91 98{uuid.uuid4().int % 100000000:08d}",
        "email": f"gurpreet_{uid}@kisansetu.in",
        "state": "Punjab",
        "district": "Ludhiana",
        "village": "Jagraon",
        "preferred_language": "pa",
    }
    res = client.post("/api/farmers/", json=punjab_farmer)
    assert res.status_code == 201
    created = res.json()
    assert f"Gurpreet Singh {uid}" in created["name"]
    assert created["state"] == "Punjab"
    assert created["district"] == "Ludhiana"

    # Update farmer location
    update_res = client.put(f"/api/farmers/{created['id']}", json={"district": "Amritsar"})
    assert update_res.status_code == 200
    assert update_res.json()["district"] == "Amritsar"


def test_buyer_registration_and_unverified_status():
    # Test creating new buyer initialized in UNVERIFIED/PENDING status
    uid = uuid.uuid4().hex[:6]
    new_buyer = {
        "name": f"Reliance Retail Fresh Hub {uid}",
        "organization": "Reliance Retail Ltd",
        "location": "Bengaluru, Karnataka",
        "phone": f"+91 97{uuid.uuid4().int % 100000000:08d}",
        "email": f"procurement_{uid}@relianceretail.com",
        "verified": False,
        "verification_status": "UNVERIFIED",
        "preferred_crops": ["Tomato", "Onion", "Potato"],
        "min_quantity_qtl": 25.0,
        "max_quantity_qtl": 500.0,
        "preferred_quality": "Grade A",
        "business_type": "Supermarket / Retail Chain",
    }
    res = client.post("/api/buyers/", json=new_buyer)
    assert res.status_code == 201
    buyer = res.json()
    assert f"Reliance Retail Fresh Hub {uid}" in buyer["name"]
    assert buyer["verified"] is False
    assert buyer["verification_status"] == "UNVERIFIED"
    assert "Tomato" in buyer["preferred_crops"]
