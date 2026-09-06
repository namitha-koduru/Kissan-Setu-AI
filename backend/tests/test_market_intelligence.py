import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.market_intelligence_service import market_intelligence_service
from app.schemas.market_intelligence import (
    NetRealizationCalculationRequest,
    PriceHistorySummary,
    PriceForecastResponse,
    MarketComparisonItem,
)
from app.ai.context_builder import context_builder
from app.database.connection import SessionLocal

client = TestClient(app)


def test_historical_prices_calculation():
    """Test historical prices, moving averages, and trend direction."""
    db = SessionLocal()
    try:
        history = market_intelligence_service.get_historical_prices(
            db=db,
            crop_name="Tomato",
            market_name="Lasalgaon APMC",
            days=30
        )
        assert history.crop == "Tomato"
        assert history.current_modal_price > 0
        assert history.current_price_per_kg > 0
        assert history.avg_7d is not None
        assert history.avg_30d is not None
        assert history.trend_direction in [
            "strongly_rising", "rising", "stable", "falling", "strongly_falling", "insufficient_data"
        ]
        assert history.volatility in ["low", "medium", "high"]
        assert len(history.history) > 0
    finally:
        db.close()


def test_price_forecast_calculation():
    """Test price forecast baseline and range boundaries."""
    db = SessionLocal()
    try:
        history = market_intelligence_service.get_historical_prices(
            db=db,
            crop_name="Onion",
            market_name="Lasalgaon APMC",
            days=14
        )
        forecast = market_intelligence_service.get_price_forecast(history=history, horizon_days=3)
        assert forecast.crop == "Onion"
        assert forecast.expected_price_qtl > 0
        assert len(forecast.expected_range_qtl) == 2
        assert forecast.expected_range_qtl[0] <= forecast.expected_price_qtl <= forecast.expected_range_qtl[1]
        assert len(forecast.drivers) > 0
        assert len(forecast.limitations) > 0
        assert len(forecast.forecast_points) == 3
    finally:
        db.close()


def test_net_realization_calculation():
    """Test net realization math deducting freight, handling, cess, and transit loss."""
    req = NetRealizationCalculationRequest(
        crop_name="Tomato",
        quantity_kg=2400.0,
        selling_price_qtl=2850.0,
        distance_km=25.0,
        handling_cost_per_qtl=25.0,
        market_cess_percent=1.05
    )
    res = market_intelligence_service.calculate_net_realization(req)
    assert res.quantity_qtl == 24.0
    assert res.gross_revenue == 24.0 * 2850.0
    assert res.transport_cost > 0
    assert res.handling_cost == 24.0 * 25.0
    assert res.total_costs == (res.transport_cost + res.handling_cost + res.market_charges + res.storage_cost + res.transit_loss_value)
    assert res.estimated_net_realization == (res.gross_revenue - res.total_costs)
    assert res.net_price_per_kg < (2850.0 / 100.0)


def test_multi_market_comparison_net_realization_ranking():
    """Test that markets are ranked by Net Realization, NOT gross listed price."""
    db = SessionLocal()
    try:
        comparisons = market_intelligence_service.compare_markets(
            db=db,
            crop_name="Tomato",
            quantity_kg=2000.0,
            farmer_location="Nashik"
        )
        assert len(comparisons) >= 4
        # Verify strictly descending order of net realization
        for i in range(len(comparisons) - 1):
            assert comparisons[i].estimated_net_realization >= comparisons[i + 1].estimated_net_realization

        best = comparisons[0]
        assert best.is_best_market is True
        assert best.opportunity_tag is not None
    finally:
        db.close()


def test_sell_decision_engine_evaluation():
    """Test SELL_NOW vs WAIT vs COMPARE decision engine."""
    db = SessionLocal()
    try:
        history = market_intelligence_service.get_historical_prices(db=db, crop_name="Tomato", market_name="Lasalgaon APMC")
        forecast = market_intelligence_service.get_price_forecast(history=history, horizon_days=3)
        comparisons = market_intelligence_service.compare_markets(db=db, crop_name="Tomato", quantity_kg=2000.0)
        best_market = comparisons[0]

        decision = market_intelligence_service.evaluate_sell_decision(
            history=history,
            forecast=forecast,
            best_market=best_market,
            crop_stage="Near maturity"
        )
        assert decision.action in ["SELL_NOW", "WAIT", "COMPARE_MARKETS", "INSUFFICIENT_DATA"]
        assert decision.decision_score >= 0 and decision.decision_score <= 100
        assert len(decision.reasons) > 0
        assert decision.storage_analysis is not None
    finally:
        db.close()


def test_buyer_opportunity_matching():
    """Test matching institutional buyers and scoring opportunities."""
    db = SessionLocal()
    try:
        opps = market_intelligence_service.get_buyer_opportunities(
            db=db,
            crop_name="Tomato",
            quantity_kg=2000.0,
            mandi_benchmark_qtl=2850.0
        )
        assert len(opps) >= 2
        top_buyer = opps[0]
        assert top_buyer.indicative_offer_qtl >= 2850.0
        assert top_buyer.is_top_buyer is True
        assert len(top_buyer.matching_reasons) > 0
    finally:
        db.close()


def test_market_intelligence_overview_endpoint():
    """Test GET /api/market-intelligence/overview endpoint."""
    res = client.get("/api/market-intelligence/overview?crop=Tomato&farmer_id=1&quantity=2000")
    assert res.status_code == 200
    data = res.json()
    assert "crop" in data
    assert "current_price" in data
    assert "trend" in data
    assert "forecast" in data
    assert "decision" in data
    assert "best_market" in data
    assert "market_comparisons" in data
    assert "buyer_opportunities" in data
    assert len(data["market_comparisons"]) > 0


def test_market_intelligence_trends_endpoint():
    """Test GET /api/market-intelligence/trends endpoint."""
    res = client.get("/api/market-intelligence/trends?crop=Onion&days=14")
    assert res.status_code == 200
    data = res.json()
    assert data["crop"] == "Onion"
    assert "current_modal_price" in data
    assert "avg_7d" in data


def test_market_intelligence_forecast_endpoint():
    """Test GET /api/market-intelligence/forecast endpoint."""
    res = client.get("/api/market-intelligence/forecast?crop=Tomato&horizon=3")
    assert res.status_code == 200
    data = res.json()
    assert data["crop"] == "Tomato"
    assert "expected_price_qtl" in data
    assert len(data["expected_range_qtl"]) == 2


def test_market_intelligence_compare_endpoint():
    """Test GET /api/market-intelligence/compare endpoint."""
    res = client.get("/api/market-intelligence/compare?crop=Grapes&quantity=1500")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 3


def test_market_intelligence_decision_endpoint():
    """Test GET /api/market-intelligence/decision endpoint."""
    res = client.get("/api/market-intelligence/decision?crop=Tomato&farmer_id=1")
    assert res.status_code == 200
    data = res.json()
    assert data["action"] in ["SELL_NOW", "WAIT", "COMPARE_MARKETS"]
    assert "decision_score" in data


def test_market_intelligence_buyer_opportunities_endpoint():
    """Test GET /api/market-intelligence/buyer-opportunities endpoint."""
    res = client.get("/api/market-intelligence/buyer-opportunities?crop=Tomato&quantity=2000")
    assert res.status_code == 200
    opps = res.json()
    assert len(opps) >= 1
    assert "indicative_offer_qtl" in opps[0]


def test_market_intelligence_net_realization_post_endpoint():
    """Test POST /api/market-intelligence/net-realization calculator endpoint."""
    payload = {
        "crop_name": "Tomato",
        "quantity_kg": 3000.0,
        "selling_price_qtl": 2900.0,
        "distance_km": 30.0,
        "handling_cost_per_qtl": 20.0,
        "market_cess_percent": 1.05
    }
    res = client.post("/api/market-intelligence/net-realization", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["quantity_qtl"] == 30.0
    assert data["gross_revenue"] == 30.0 * 2900.0
    assert data["estimated_net_realization"] > 0


def test_context_builder_includes_market_intelligence():
    """Test that context builder injects structured market prices, trend, forecast, and SELL/WAIT decision into LLM context."""
    db = SessionLocal()
    try:
        ctx = context_builder.build_context(db, farmer_id=1)
        assert "Market Intelligence" in ctx
        assert "AI Selling Signal:" in ctx
        assert "Recommended Best Market:" in ctx
    finally:
        db.close()


def test_chat_market_intelligence_selling_decision():
    """Test that AI Chat answers 'Should I sell my tomato crop now or wait?' using structured market intelligence."""
    payload = {
        "message": "Should I sell my tomato crop now or wait for a higher price?",
        "farmer_id": 1,
        "language": "en"
    }
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 20
