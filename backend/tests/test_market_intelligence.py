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
        assert decision.action in ["SELL_NOW", "HOLD", "MONITOR", "COMPARE_MARKETS", "WAIT", "INSUFFICIENT_DATA"]
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
    assert data["action"] in ["SELL_NOW", "HOLD", "MONITOR", "COMPARE_MARKETS", "WAIT"]
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


def test_crop_distinctiveness_cotton_potato_tomato():
    """
    Rigorously verify that Cotton != Potato != Tomato across all 8 market intelligence dimensions:
    1. Current modal price
    2. Regional mandis and primary yard
    3. 7-day trend and volatility
    4. Price direction
    5. Buyer opportunities (ginners/mills vs cold storage/processors vs fresh retail)
    6. Forecast expected price
    7. Net realization deductions
    8. Storage holding economics and sell/hold decision
    """
    db = SessionLocal()
    try:
        overview_cotton = market_intelligence_service.get_market_intelligence_overview(
            db=db, crop_name="Cotton", farmer_location="Jalgaon", quantity_kg=3000.0
        )
        overview_potato = market_intelligence_service.get_market_intelligence_overview(
            db=db, crop_name="Potato", farmer_location="Pune", quantity_kg=3000.0
        )
        overview_tomato = market_intelligence_service.get_market_intelligence_overview(
            db=db, crop_name="Tomato", farmer_location="Nashik", quantity_kg=3000.0
        )

        # 1. Current modal prices must be distinctly crop-specific
        p_cotton = overview_cotton.current_price.current_modal_price
        p_potato = overview_potato.current_price.current_modal_price
        p_tomato = overview_tomato.current_price.current_modal_price
        assert p_cotton > 6000.0, f"Cotton price ({p_cotton}) should reflect authentic cotton benchmark (>6000)"
        assert 1200.0 <= p_potato <= 2500.0, f"Potato price ({p_potato}) should reflect tuber benchmark"
        assert 2000.0 <= p_tomato <= 4500.0, f"Tomato price ({p_tomato}) should reflect vegetable benchmark"
        assert p_cotton != p_potato != p_tomato

        # 2. Mandi comparisons must be crop-appropriate
        cotton_mandis = [m.market_name for m in overview_cotton.market_comparisons]
        potato_mandis = [m.market_name for m in overview_potato.market_comparisons]
        tomato_mandis = [m.market_name for m in overview_tomato.market_comparisons]

        assert any("Cotton" in m or "Jalgaon" in m or "Wardha" in m or "Hinganghat" in m for m in cotton_mandis)
        assert any("Gultekdi" in m or "Manchar" in m or "Pune" in m for m in potato_mandis)
        assert any("Lasalgaon" in m or "Pimpalgaon" in m or "Nashik" in m for m in tomato_mandis)

        # 3. Volatility characteristics
        assert overview_cotton.current_price.volatility == "low"
        assert overview_tomato.current_price.volatility == "high"

        # 4. Buyer opportunities must match crop industries
        cotton_buyers = [(b.get("buyer_name", "") + " " + b.get("company_name", "")) for b in overview_cotton.buyer_opportunities["opportunities"]]
        potato_buyers = [(b.get("buyer_name", "") + " " + b.get("company_name", "")) for b in overview_potato.buyer_opportunities["opportunities"]]
        tomato_buyers = [(b.get("buyer_name", "") + " " + b.get("company_name", "")) for b in overview_tomato.buyer_opportunities["opportunities"]]


        assert any("Ginning" in b or "Textile" in b or "CCI" in b or "Spinning" in b for b in cotton_buyers), "Cotton buyers should be ginners/mills"
        assert any("Cold Storage" in b or "Snack" in b or "Processing" in b or "Wafer" in b for b in potato_buyers), "Potato buyers should include cold storage/snack processors"
        assert any("Retail" in b or "Food Park" in b or "Processing" in b or "Agri" in b for b in tomato_buyers), "Tomato buyers should include food parks/fresh retail"

        # 5. Forecast drivers must be crop-specific
        assert any("Cotton" in d or "CCI" in d or "mills" in d.lower() for d in overview_cotton.forecast.drivers)
        assert any("storage" in d.lower() or "wafer" in d.lower() for d in overview_potato.forecast.drivers)
        assert any("Tomato" in d or "arrival" in d.lower() or "rain" in d.lower() or "momentum" in d.lower() for d in overview_tomato.forecast.drivers)

        # 6. Net realization totals must scale with crop price
        assert overview_cotton.best_market.estimated_net_realization > overview_tomato.best_market.estimated_net_realization
        assert overview_tomato.best_market.estimated_net_realization > overview_potato.best_market.estimated_net_realization

        # 7. Holding economics
        cotton_hold_cost = overview_cotton.decision.storage_analysis.get("estimated_holding_cost_3d_qtl", 0)
        tomato_hold_cost = overview_tomato.decision.storage_analysis.get("estimated_holding_cost_3d_qtl", 0)
        # Tomato has perishable storage cost significantly higher than cotton dry godown cost
        assert tomato_hold_cost >= cotton_hold_cost
    finally:
        db.close()


def test_location_awareness_distance_and_freight():
    """Verify that changing farmer location properly adjusts mandi distances and net realization."""
    db = SessionLocal()
    try:
        comp_nashik = market_intelligence_service.compare_markets(
            db=db, crop_name="Tomato", quantity_kg=2000.0, farmer_location="Nashik"
        )
        comp_pune = market_intelligence_service.compare_markets(
            db=db, crop_name="Tomato", quantity_kg=2000.0, farmer_location="Pune"
        )

        nashik_mandi_from_nashik = next(m for m in comp_nashik if "Nashik" in m.market_name or "Pimpalgaon" in m.market_name)
        nashik_mandi_from_pune = next(m for m in comp_pune if "Nashik" in m.market_name or "Pimpalgaon" in m.market_name)

        # Distance to Nashik mandi from Pune is significantly farther than from Nashik
        assert nashik_mandi_from_pune.distance_km > nashik_mandi_from_nashik.distance_km
        assert nashik_mandi_from_pune.estimated_transport_cost > nashik_mandi_from_nashik.estimated_transport_cost
    finally:
        db.close()

