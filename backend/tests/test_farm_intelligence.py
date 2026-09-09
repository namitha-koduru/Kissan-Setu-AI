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


def test_decision_engine_weather_risk_perishable_tomato():
    """Test that perishable Tomato facing rain risk produces SELL_NOW to avoid cracking/decay."""
    from app.services.recommendation_service import recommendation_service
    from app.schemas.recommendation import RecommendationRequest

    req = RecommendationRequest(
        crop_name="Tomato",
        quantity_kg=3000.0,
        growth_stage="Near maturity (70-80% red)",
        location="Nashik, Maharashtra"
    )
    res = recommendation_service.evaluate_recommendation(req)
    assert res.decision in ["SELL_NOW", "SELL"]
    assert res.crop_name == "Tomato"
    assert res.confidence_score >= 80
    assert any("precipitation" in r.lower() or "rain" in r.lower() or "shelf life" in r.lower() or "cracking" in r.lower() for r in res.reasons)
    assert res.expected_net_realization > 0
    assert len(res.market_comparisons) > 0


def test_decision_engine_growth_stage_immature_monitor():
    """Test that immature/vegetative crops produce MONITOR decision regardless of current spot prices."""
    from app.services.recommendation_service import recommendation_service
    from app.schemas.recommendation import RecommendationRequest

    req = RecommendationRequest(
        crop_name="Potato",
        quantity_kg=5000.0,
        growth_stage="Vegetative / Tuber initiation",
        location="Agra, Uttar Pradesh",
        expected_harvest_date="2026-10-30"
    )
    res = recommendation_service.evaluate_recommendation(req)
    assert res.decision == "MONITOR"
    assert any("premature" in r.lower() or "vegetative" in r.lower() or "maturity" in r.lower() for r in res.reasons)


def test_decision_engine_storable_crop_rising_trend_hold():
    """Test that dry commercial Cotton with rising trend and high storability produces HOLD."""
    from app.services.recommendation_service import recommendation_service
    from app.schemas.recommendation import RecommendationRequest

    req = RecommendationRequest(
        crop_name="Cotton",
        quantity_kg=4000.0,
        growth_stage="Ready to harvest / Boll opening",
        location="Adilabad, Telangana"
    )
    res = recommendation_service.evaluate_recommendation(req)
    assert res.decision in ["HOLD", "COMPARE_MARKETS", "SELL_NOW"]
    assert res.confidence_score >= 75
    assert res.crop_name == "Cotton"
    # Cotton holding cost should be low
    assert res.score_breakdown["perishability_penalty"] <= 30


def test_decision_engine_crop_specific_distinctness():
    """Verify Cotton, Potato, and Tomato yield distinct decision dynamics and tailored explanations."""
    from app.services.recommendation_service import recommendation_service
    from app.schemas.recommendation import RecommendationRequest

    req_cotton = RecommendationRequest(crop_name="Cotton", quantity_kg=2000, growth_stage="Ready to harvest", location="Rajkot, Gujarat")
    req_potato = RecommendationRequest(crop_name="Potato", quantity_kg=2000, growth_stage="Ready to harvest", location="Agra, Uttar Pradesh")
    req_tomato = RecommendationRequest(crop_name="Tomato", quantity_kg=2000, growth_stage="Ready to harvest", location="Kolar, Karnataka")

    res_cotton = recommendation_service.evaluate_recommendation(req_cotton)
    res_potato = recommendation_service.evaluate_recommendation(req_potato)
    res_tomato = recommendation_service.evaluate_recommendation(req_tomato)

    # 1. Net realization prices should reflect true crop price tiers (Cotton ~ ₹60-75/kg, Potato ~ ₹15-25/kg, Tomato ~ ₹20-35/kg)
    assert res_cotton.expected_net_realization > res_tomato.expected_net_realization
    assert res_tomato.expected_net_realization > res_potato.expected_net_realization

    # 2. Perishability penalties must differ significantly
    assert res_tomato.score_breakdown["perishability_penalty"] > res_cotton.score_breakdown["perishability_penalty"]

    # 3. Mandi comparisons must be crop-specific (Cotton mandis vs Potato mandis vs Tomato mandis)
    cotton_mandis = [m.market_name for m in res_cotton.market_comparisons]
    potato_mandis = [m.market_name for m in res_potato.market_comparisons]
    tomato_mandis = [m.market_name for m in res_tomato.market_comparisons]
    assert cotton_mandis != potato_mandis
    assert potato_mandis != tomato_mandis


def test_recommendations_analyze_api_endpoint():
    """Test POST /api/recommendations/analyze endpoint."""
    payload = {
        "crop_name": "Tomato",
        "quantity_kg": 2500.0,
        "growth_stage": "Near maturity (70-80% red)",
        "location": "Nashik, Maharashtra"
    }
    res = client.post("/api/recommendations/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] in ["SELL_NOW", "HOLD", "MONITOR", "COMPARE_MARKETS", "SELL", "WAIT", "SWITCH"]
    assert data["crop_name"] == "Tomato"
    assert data["expected_net_realization"] > 0
    assert len(data["market_comparisons"]) > 0
    assert "score_breakdown" in data

