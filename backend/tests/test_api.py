import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "KissanSetuAI"


def test_get_farmer():
    response = client.get("/api/farmers/1")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Ramesh Kumar"
    assert data["district"] == "Nashik"


def test_get_farmer_crops():
    response = client.get("/api/farmers/1/crops")
    assert response.status_code == 200
    crops = response.json()
    assert len(crops) >= 3
    crop_names = [c["crop_name"] for c in crops]
    assert "Tomato" in crop_names
    assert "Onion" in crop_names
    assert "Grapes" in crop_names


def test_get_markets():
    response = client.get("/api/markets")
    assert response.status_code == 200
    markets = response.json()
    assert len(markets) >= 3
    market_names = [m["name"] for m in markets]
    assert any("Lasalgaon" in name for name in market_names)
    assert any("Nashik" in name for name in market_names)


def test_get_market_prices():
    # Market 1 prices
    response = client.get("/api/markets/1/prices")
    assert response.status_code == 200
    prices = response.json()
    assert len(prices) >= 1
    assert "price" in prices[0]


def test_get_buyers():
    response = client.get("/api/buyers")
    assert response.status_code == 200
    buyers = response.json()
    assert len(buyers) >= 3


def test_get_farmer_lots():
    response = client.get("/api/farmers/1/lots")
    assert response.status_code == 200
    lots = response.json()
    assert len(lots) >= 1


def test_get_offers_for_lot():
    response = client.get("/api/lots/1/offers")
    assert response.status_code == 200
    offers = response.json()
    assert isinstance(offers, list)


def test_weather_endpoint():
    response = client.get("/api/weather?location=Nashik")
    assert response.status_code == 200
    data = response.json()
    assert data["district"] == "Nashik"
    assert "temperature" in data
    assert "humidity" in data
    assert "rain_probability" in data
    assert "agricultural_advisory" in data
    assert len(data["forecast"]) == 7


def test_recommendation_endpoint():
    response = client.get("/api/recommendations?crop=Tomato&quantity=2400&location=Nashik")
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] in ["SELL", "WAIT", "SWITCH"]
    assert "confidence_score" in data
    assert "market_comparisons" in data
    assert len(data["market_comparisons"]) > 0


def test_create_and_delete_crop():
    new_crop = {
        "farmer_id": 1,
        "crop_name": "Pomegranate",
        "variety": "Bhagwa",
        "acreage": 1.5,
        "quantity": 1200.0,
        "sowing_date": "2026-01-10",
        "expected_harvest_date": "2026-11-20",
        "growth_stage": "Fruit enlargement",
        "soil_type": "Loamy Sand"
    }
    create_res = client.post("/api/crops", json=new_crop)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Read
    get_res = client.get(f"/api/crops/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["crop_name"] == "Pomegranate"

    # Delete
    del_res = client.delete(f"/api/crops/{created_id}")
    assert del_res.status_code == 204
