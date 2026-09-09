import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import get_db
from app.database.models import (
    Farmer,
    Crop,
    Buyer,
    Lot,
    Offer,
    Transaction,
    TransactionEvent,
    Dispute,
    MarketPrice,
    Market,
)
from app.services.buyer_matching_service import buyer_matching_service
from app.services.offer_intelligence_service import offer_intelligence_service
from app.services.transaction_service import transaction_service
from app.services.inventory_service import inventory_service
from app.schemas.buyer_matching import (
    CounterOfferRequest,
    LogisticsUpdateRequest,
    PaymentRecordRequest,
    DisputeCreateRequest,
    DisputeResolveRequest,
)

client = TestClient(app)


@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


def test_buyer_matching_scoring_and_ranking(db_session: Session):
    """Verify 7-factor transparent matching algorithm generates 0-100 scores and explainable reasons."""
    resp = buyer_matching_service.match_buyers_for_lot(
        db=db_session,
        crop_name="Tomato",
        quantity_qtl=20.0,
        quality_grade="Grade A",
        farmer_location="Nashik, Maharashtra",
    )
    assert resp.matched_buyers_count > 0
    assert resp.crop_name == "Tomato"
    assert resp.mandi_benchmark_price_per_kg > 0

    top_buyer = resp.buyers[0]
    assert 0 <= top_buyer.match_score <= 100
    assert len(top_buyer.reasons) > 0
    assert top_buyer.comparison is not None
    assert top_buyer.comparison.direct_net_realization > 0
    assert len(top_buyer.factors) == 7


def test_direct_vs_mandi_net_realization_calculation():
    """Verify direct buyer vs APMC mandi net realization calculation formula."""
    comp = buyer_matching_service.calculate_direct_vs_mandi_comparison(
        crop_name="Tomato",
        quantity_qtl=20.0,
        buyer_name="Sahyadri Farms FPC",
        buyer_indicative_price=29.0,
        mandi_benchmark_price=27.5,
        mandi_distance_km=35.0,
        buyer_distance_km=25.0,
    )
    assert comp.quantity_kg == 2000.0
    assert comp.direct_gross_revenue == 58000.0
    assert comp.direct_transport_cost == 1100.0  # 20 * 2.2 * 25
    assert comp.direct_net_realization == 56900.0
    assert comp.mandi_gross_revenue == 55000.0
    assert comp.net_advantage_total > 0
    assert comp.recommended_channel == "DIRECT_BUYER"


def test_get_recommended_buyers_endpoint():
    """Verify GET /api/buyers/recommended endpoint returns ranked list."""
    response = client.get("/api/buyers/recommended?crop_name=Tomato&quantity_qtl=20.0&verified_only=false")
    assert response.status_code == 200
    data = response.json()
    assert "buyers" in data
    assert len(data["buyers"]) > 0
    assert data["buyers"][0]["match_score"] >= data["buyers"][-1]["match_score"]


def test_get_buyer_match_detail_endpoint(db_session: Session):
    """Verify GET /api/buyers/{buyer_id}/match endpoint returns 7-factor breakdown."""
    buyer = db_session.query(Buyer).first()
    assert buyer is not None
    response = client.get(f"/api/buyers/{buyer.id}/match?crop_name=Tomato&quantity_qtl=20.0")
    assert response.status_code == 200
    data = response.json()
    assert data["buyer_id"] == buyer.id
    assert "factors" in data
    assert len(data["factors"]) == 7


def test_create_lot_and_inspect_offers(db_session: Session):
    """Verify creating a lot with Phase 6 fields and inspecting incoming offers."""
    farmer = db_session.query(Farmer).first()
    crop = db_session.query(Crop).filter(Crop.farmer_id == farmer.id).first()
    buyer = db_session.query(Buyer).first()

    # Ensure stock is available for lot creation
    inventory_service.get_or_create_inventory(
        db=db_session,
        farmer_id=farmer.id,
        crop_name=crop.crop_name,
        initial_quantity=2000.0,
    )

    lot_payload = {
        "farmer_id": farmer.id,
        "crop_id": crop.id,
        "quantity": 1500.0,
        "unit": "kg",
        "asking_price": 28.0,
        "quality": "Grade A",
        "quality_description": "Firm table quality red tomatoes",
        "harvest_date": "2026-09-10",
        "harvest_window": "Within 3 days",
        "location": "Nashik Farm Gate #1",
        "status": "Open for Offers",
        "preferred_buyer_id": buyer.id if buyer else None,
    }

    resp = client.post("/api/lots", json=lot_payload)
    assert resp.status_code == 201
    lot_data = resp.json()
    assert lot_data["quantity"] == 1500.0
    assert lot_data["quality_description"] == "Firm table quality red tomatoes"
    new_lot_id = lot_data["id"]

    # Create an offer on this lot
    offer_payload = {
        "lot_id": new_lot_id,
        "buyer_id": buyer.id,
        "offered_price": 28.5,
        "quantity_kg": 1500.0,
        "quality_grade": "Grade A",
        "message": "Farm gate collection on Thursday.",
    }
    offer_resp = client.post("/api/offers", json=offer_payload)
    assert offer_resp.status_code == 201
    offer_data = offer_resp.json()
    assert offer_data["offered_price"] == 28.5


def test_offer_intelligence_and_negotiation_flow(db_session: Session):
    """Verify offer intelligence calculation, counter-offering, and history preservation."""
    offer = db_session.query(Offer).filter(Offer.status == "Pending").first()
    if not offer:
        farmer = db_session.query(Farmer).first()
        crop = db_session.query(Crop).first()
        buyer = db_session.query(Buyer).first()
        lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=1000.0, asking_price=30.0)
        db_session.add(lot)
        db_session.commit()
        db_session.refresh(lot)
        offer = Offer(lot_id=lot.id, buyer_id=buyer.id, offered_price=28.0, quantity_kg=1000.0, status="Pending")
        db_session.add(offer)
        db_session.commit()
        db_session.refresh(offer)

    # 1. Offer Intelligence
    resp = client.get(f"/api/offers/{offer.id}/intelligence")
    assert resp.status_code == 200
    intel = resp.json()
    assert intel["offer_id"] == offer.id
    assert intel["offered_price"] == offer.offered_price
    assert intel["suggested_counter_min"] > 0
    assert intel["suggested_counter_max"] >= intel["suggested_counter_min"]
    assert len(intel["negotiation_tip"]) > 0

    # 2. Counter-Offer
    counter_resp = client.post(
        f"/api/offers/{offer.id}/counter",
        json={"counter_price": 29.50, "quantity_kg": 1000.0, "message": "Farmer requesting ₹29.50/kg for Grade A produce."},
    )
    assert counter_resp.status_code == 200
    counter_data = counter_resp.json()
    assert counter_data["status"] == "Countered"
    assert counter_data["counter_price"] == 29.50

    # 3. History Thread
    hist_resp = client.get(f"/api/offers/{offer.id}/history")
    assert hist_resp.status_code == 200
    hist = hist_resp.json()
    assert len(hist) >= 2
    assert hist[0]["sender_role"] == "Buyer"
    assert hist[1]["sender_role"] == "Farmer"
    assert hist[1]["counter_price"] == 29.50


def test_accept_offer_creates_transaction(db_session: Session):
    """Verify accepting an offer atomically generates transaction contract and audit trail."""
    farmer = db_session.query(Farmer).first()
    crop = db_session.query(Crop).first()
    buyer = db_session.query(Buyer).first()

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=1200.0, asking_price=27.0)
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)

    offer = Offer(lot_id=lot.id, buyer_id=buyer.id, offered_price=27.50, quantity_kg=1200.0, status="Pending")
    db_session.add(offer)
    db_session.commit()
    db_session.refresh(offer)

    resp = client.post(f"/api/offers/{offer.id}/accept")
    assert resp.status_code == 200
    tx_data = resp.json()
    assert tx_data["lot_id"] == lot.id
    assert tx_data["final_price"] == 27.50
    assert tx_data["total_amount"] == 1200.0 * 27.50
    assert tx_data["status"] == "CONFIRMED"

    # Verify transaction details endpoint
    tx_id = tx_data["id"]
    det_resp = client.get(f"/api/transactions/{tx_id}/detail")
    assert det_resp.status_code == 200
    detail = det_resp.json()
    assert detail["id"] == tx_id
    assert len(detail["events"]) >= 2
    assert detail["events"][0]["stage_label"] == "Offer Accepted"


def test_transaction_state_machine_and_logistics(db_session: Session):
    """Verify valid state transitions and rejection of invalid state jumps."""
    farmer = db_session.query(Farmer).first()
    crop = db_session.query(Crop).first()
    buyer = db_session.query(Buyer).first()

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=1000.0, asking_price=25.0)
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)

    tx = Transaction(
        lot_id=lot.id,
        farmer_id=farmer.id,
        buyer_id=buyer.id,
        quantity_kg=1000.0,
        final_price=25.0,
        total_amount=25000.0,
        status="CONFIRMED",
        logistics_status="NOT_SCHEDULED",
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)

    # Update logistics
    logistics_payload = {
        "logistics_status": "SCHEDULED",
        "pickup_date": "2026-09-08 09:00 AM",
        "pickup_location": "Dindori Farm Gate",
        "delivery_location": "Nashik Agri Hub",
        "transport_cost_actual": 1500.0,
    }
    log_resp = client.post(f"/api/transactions/{tx.id}/logistics", json=logistics_payload)
    assert log_resp.status_code == 200
    log_data = log_resp.json()
    assert log_data["logistics_status"] == "SCHEDULED"
    assert log_data["transport_cost_actual"] == 1500.0

    # Advance to IN_TRANSIT
    trans_resp = client.put(f"/api/transactions/{tx.id}/status", json={"status": "IN_TRANSIT"})
    assert trans_resp.status_code == 200
    assert trans_resp.json()["status"] == "IN_TRANSIT"

    # Reject invalid transition jump (e.g. IN_TRANSIT -> CREATED)
    invalid_resp = client.put(f"/api/transactions/{tx.id}/status", json={"status": "CREATED"})
    assert invalid_resp.status_code == 400
    assert "Invalid state transition" in invalid_resp.json()["detail"]


def test_payment_tracking_and_disputes(db_session: Session):
    """Verify payment receipt recording and dispute filing/resolution."""
    farmer = db_session.query(Farmer).first()
    crop = db_session.query(Crop).first()
    buyer = db_session.query(Buyer).first()

    lot = Lot(farmer_id=farmer.id, crop_id=crop.id, quantity=2000.0, asking_price=50.0)
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)

    tx = Transaction(
        lot_id=lot.id,
        farmer_id=farmer.id,
        buyer_id=buyer.id,
        quantity_kg=2000.0,
        final_price=50.0,
        total_amount=100000.0,
        expected_amount=100000.0,
        paid_amount=0.0,
        status="DELIVERED",
        payment_status="PENDING",
    )
    db_session.add(tx)
    db_session.commit()
    db_session.refresh(tx)

    # 1. Record partial payment
    pay_payload = {
        "paid_amount": 50000.0,
        "payment_status": "PARTIAL",
        "payment_date": "2026-09-08",
        "payment_reference": "NEFT-TEST-001",
    }
    pay_resp = client.put(f"/api/transactions/{tx.id}/payment", json=pay_payload)
    assert pay_resp.status_code == 200
    pay_data = pay_resp.json()
    assert pay_data["paid_amount"] == 50000.0
    assert pay_data["payment_status"] == "PARTIAL"

    # 2. File dispute
    dispute_payload = {
        "category": "payment",
        "description": "Remaining payment of ₹50,000 delayed by 2 days past agreed deadline.",
        "raised_by_role": "farmer",
    }
    disp_resp = client.post(f"/api/transactions/{tx.id}/dispute", json=dispute_payload)
    assert disp_resp.status_code == 200
    disp_data = disp_resp.json()
    assert disp_data["status"] == "OPEN"
    assert disp_data["category"] == "payment"
    dispute_id = disp_data["id"]

    # 3. Resolve dispute
    resolve_payload = {
        "status": "RESOLVED",
        "resolution_notes": "Buyer cleared remaining balance via IMPS ref: IMPS-778811.",
    }
    resolve_resp = client.put(f"/api/transactions/disputes/{dispute_id}/resolve", json=resolve_payload)
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "RESOLVED"


def test_context_builder_includes_phase6_buyer_and_transactions(db_session: Session):
    """Verify FarmContextBuilder injects Phase 6 buyer matching and transaction state."""
    from app.ai.context_builder import context_builder
    farmer = db_session.query(Farmer).first()

    ctx = context_builder.build_context(db=db_session, farmer_id=farmer.id)
    assert "Top Matched Buyer (Phase 6)" in ctx
    assert "Why This Buyer" in ctx
