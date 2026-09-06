import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.soil_service import soil_service
from app.services.crop_suitability_engine import crop_suitability_engine
from app.services.weather_intelligence import weather_intelligence_service
from app.services.farm_risk_service import farm_risk_service
from app.services.farm_intelligence_service import farm_intelligence_service
from app.ai.context_builder import context_builder
from app.database.connection import SessionLocal
from app.database.models import SoilProfile, Crop, Farmer

client = TestClient(app)


def test_soil_validation_invalid_ph():
    """Test that pH outside 3.0-11.0 is rejected by validation."""
    response = client.post("/api/soil", json={"farmer_id": 1, "ph": 14.5, "soil_type": "Black"})
    assert response.status_code == 422  # Unprocessable Entity


def test_soil_validation_negative_nutrients():
    """Test that negative nutrient values are rejected."""
    response = client.post("/api/soil", json={"farmer_id": 1, "nitrogen": -50.0, "soil_type": "Black"})
    assert response.status_code == 422


def test_create_and_get_soil_profile():
    """Test creating and retrieving farmer soil profile with interpretation."""
    payload = {
        "farmer_id": 1,
        "soil_type": "Black",
        "ph": 7.4,
        "nitrogen": 260.0,
        "phosphorus": 22.0,
        "potassium": 310.0,
        "organic_carbon": 0.65,
        "moisture": 28.0,
        "source": "Soil Health Card Test"
    }
    create_res = client.post("/api/soil", json=payload)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["has_data"] is True
    assert data["ph_status"] in ["neutral", "slightly_alkaline"]
    assert data["nitrogen_status"] == "low"
    assert data["phosphorus_status"] == "medium"
    assert data["potassium_status"] == "high"
    assert len(data["observations"]) > 0

    # Retrieve via GET
    get_res = client.get("/api/soil?farmer_id=1")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["profile"]["ph"] == 7.4
    assert get_data["profile"]["soil_type"] == "Black"


def test_update_soil_profile():
    """Test updating specific soil parameters."""
    update_payload = {
        "ph": 6.8,
        "nitrogen": 320.0
    }
    put_res = client.put("/api/soil?farmer_id=1", json=update_payload)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["profile"]["ph"] == 6.8
    assert data["ph_status"] == "neutral"
    assert data["nitrogen_status"] == "medium"


def test_soil_service_missing_data_graceful():
    """Test that missing/untested soil profile produces helpful guidance rather than errors."""
    interp = soil_service.interpret_soil(None)
    assert interp.has_data is False
    assert interp.ph_status == "unknown"
    assert any("Add your soil type" in obs for obs in interp.observations)


def test_weather_intelligence_signals():
    """Test extracting agricultural signals from weather."""
    signals = weather_intelligence_service.extract_weather_signals("Nashik")
    assert signals.rain_risk in ["low", "medium", "high"]
    assert signals.spraying_risk in ["safe", "caution", "avoid"]
    assert signals.irrigation_need in ["skip", "reduced", "normal", "increase"]
    assert signals.harvest_weather_risk in ["low", "medium", "high"]
    assert len(signals.advisories) > 0


def test_crop_suitability_calculation():
    """Test crop suitability score calculation and explainable reasons."""
    db = SessionLocal()
    try:
        soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == 1).first()
        weather = weather_intelligence_service.extract_weather_signals("Nashik")
        rankings = crop_suitability_engine.rank_crops_for_farm(soil=soil, weather=weather, location="Nashik, Maharashtra")

        assert len(rankings) >= 3
        top_crop = rankings[0]
        assert top_crop.suitability_score >= 0 and top_crop.suitability_score <= 100
        assert len(top_crop.reasons) > 0
        assert top_crop.compatibility_level in ["Highly Suitable", "Suitable", "Moderate", "Challenging"]
    finally:
        db.close()


def test_farm_risk_engine():
    """Test multi-source risk calculation."""
    db = SessionLocal()
    try:
        crops = db.query(Crop).filter(Crop.farmer_id == 1).all()
        soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == 1).first()
        weather = weather_intelligence_service.extract_weather_signals("Nashik")

        risk_summary = farm_risk_service.evaluate_farm_risks(crops, soil, weather)
        assert risk_summary.overall_risk in ["low", "medium", "high"]
        assert risk_summary.risk_score >= 0 and risk_summary.risk_score <= 100
        assert isinstance(risk_summary.risks, list)
    finally:
        db.close()


def test_farm_intelligence_overview_endpoint():
    """Test consolidated GET /api/farm-intelligence/overview endpoint."""
    res = client.get("/api/farm-intelligence/overview?farmer_id=1")
    assert res.status_code == 200
    data = res.json()

    assert "farm" in data
    assert "weather" in data
    assert "soil" in data
    assert "active_crops" in data
    assert "risks" in data
    assert "recommendations" in data
    assert "action_plan" in data
    assert "crop_suitability" in data

    # Verify action plan structure
    action_plan = data["action_plan"]
    assert "today" in action_plan
    assert "this_week" in action_plan
    assert "routine" in action_plan


def test_farm_intelligence_recommendations_endpoint():
    """Test GET /api/farm-intelligence/recommendations."""
    res = client.get("/api/farm-intelligence/recommendations?farmer_id=1")
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)
    assert len(recs) > 0
    assert "priority" in recs[0]
    assert "reason" in recs[0]
    assert "action" in recs[0]


def test_farm_intelligence_crop_suitability_endpoint():
    """Test GET /api/farm-intelligence/crop-suitability."""
    res = client.get("/api/farm-intelligence/crop-suitability?farmer_id=1")
    assert res.status_code == 200
    suitability = res.json()
    assert len(suitability) >= 3
    crop_names = [c["crop"] for c in suitability]
    assert "Tomato" in crop_names or "Onion" in crop_names


def test_context_builder_includes_farm_intelligence():
    """Test that context_builder incorporates soil, weather signals, and risks into LLM context."""
    db = SessionLocal()
    try:
        context_str = context_builder.build_context(db, farmer_id=1)
        assert "Farm Soil Status:" in context_str
        assert "Agricultural Weather Signals:" in context_str
        assert "Farm Risk Level:" in context_str
        assert "Regional Crop Suitability Ranking:" in context_str
    finally:
        db.close()


def test_chat_with_farm_intelligence():
    """Test that AI Chat answers farm intelligence questions (What should I do today)."""
    chat_payload = {
        "message": "What farming activity should I prioritize today on my farm?",
        "farmer_id": 1,
        "language": "en"
    }
    response = client.post("/api/chat", json=chat_payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
    assert data["language"] == "en"
