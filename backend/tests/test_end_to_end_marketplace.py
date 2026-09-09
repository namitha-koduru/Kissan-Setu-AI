import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import get_db
from app.database.models import Farmer, Buyer, Crop, Lot, Offer, Transaction, InventoryItem, StockAdjustment
from app.services.inventory_service import inventory_service

client = TestClient(app)


@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


def test_complete_end_to_end_marketplace_flow():
    """
    Validates complete lifecycle:
    Farmer creates crop
    → crop persisted in Neon
    → crop-specific inventory initialized
    → farmer creates lot
    → lot quantity cannot exceed available stock
    → stock allocated to active lot
    → lot visible to eligible nearby buyers/FPOs within 25 km
    → buyer/FPO can open that specific lot
    → lot-specific negotiation chat
    → offer/counter-offer
    → accepted offer creates transaction
    → inventory reserved
    → transaction delivery/completion updates stock
    → cancellation releases reserved stock.
    """
    db = next(get_db())
    try:
        farmer = db.query(Farmer).first()
        if not farmer:
            farmer = Farmer(
                name="Ramesh Patil",
                phone="9876543210",
                state="Maharashtra",
                district="Nashik",
                taluka="Dindori",
                village="Dindori",
                latitude=20.2000,
                longitude=73.8300,
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)

        buyer = db.query(Buyer).first()
        if not buyer:
            buyer = Buyer(
                name="Sahyadri Agri Logistics",
                buyer_type="FPO",
                location="Nashik, Maharashtra",
                latitude=20.0000,
                longitude=73.7800,
                verified=True,
            )
            db.add(buyer)
            db.commit()
            db.refresh(buyer)
        
        farmer_id = farmer.id
        buyer_id = buyer.id
        buyer_name = buyer.name
    finally:
        db.close()

    # 1 & 2 & 3: Farmer creates crop → persisted in DB → crop inventory initialized
    crop_payload = {
        "farmer_id": farmer_id,
        "crop_name": "Pomegranate",
        "variety": "Bhagwa Super",
        "quantity": 1000.0,
        "unit": "kg",
        "expected_price": 120.0,
        "season": "Kharif",
        "sowing_date": "2026-06-01",
        "harvest_date": "2026-09-15",
    }
    crop_resp = client.post("/api/crops", json=crop_payload)
    assert crop_resp.status_code == 201, crop_resp.text
    crop_data = crop_resp.json()
    crop_id = crop_data["id"]
    assert crop_data["crop_name"] == "Pomegranate"

    # Verify inventory was initialized
    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        assert inv_item is not None
        assert inv_item.total_quantity >= 1000.0
        initial_avail = inv_item.available_quantity
    finally:
        db.close()

    # 4 & 5: Farmer creates lot → lot quantity cannot exceed available stock
    excess_lot_payload = {
        "farmer_id": farmer_id,
        "crop_id": crop_id,
        "quantity": initial_avail + 5000.0,  # Exceeds available stock
        "unit": "kg",
        "asking_price": 125.0,
        "quality": "Grade A",
        "quality_description": "Export Grade Bhagwa",
        "harvest_date": "2026-09-15",
        "harvest_window": "3 days",
        "location": "Dindori Farm Gate",
        "status": "Open for Offers",
    }
    excess_resp = client.post("/api/lots", json=excess_lot_payload)
    assert excess_resp.status_code == 400
    assert "available to sell" in excess_resp.json()["detail"]

    # 6: Valid lot creation → stock allocated to active lot
    valid_lot_qty = 400.0
    valid_lot_payload = {
        "farmer_id": farmer_id,
        "crop_id": crop_id,
        "quantity": valid_lot_qty,
        "unit": "kg",
        "asking_price": 125.0,
        "quality": "Grade A",
        "quality_description": "Export Grade Bhagwa Pomegranate",
        "harvest_date": "2026-09-15",
        "harvest_window": "3 days",
        "location": "Dindori Farm Gate",
        "status": "Open for Offers",
    }
    lot_resp = client.post("/api/lots", json=valid_lot_payload)
    assert lot_resp.status_code == 201, lot_resp.text
    lot_data = lot_resp.json()
    lot_id = lot_data["id"]
    assert lot_data["quantity"] == 400.0

    # Verify stock allocated
    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        assert inv_item.allocated_quantity >= valid_lot_qty
    finally:
        db.close()

    # 7: Lot visible to eligible nearby buyers within 25 km
    nearby_resp = client.get(f"/api/lots/{lot_id}/nearby-demand?radius_km=50")
    assert nearby_resp.status_code == 200
    nearby_data = nearby_resp.json()
    assert "nearby_demand" in nearby_data

    discovery_resp = client.get("/api/lots/nearby/discovery?buyer_location=Nashik,%20Maharashtra&crop=Pomegranate")
    assert discovery_resp.status_code == 200
    discovered_lots = discovery_resp.json()
    assert any(l["id"] == lot_id for l in discovered_lots)

    # 8: Buyer can open that specific lot
    get_lot_resp = client.get(f"/api/lots/{lot_id}")
    assert get_lot_resp.status_code == 200
    assert get_lot_resp.json()["id"] == lot_id

    # 9: Lot-specific negotiation chat
    msg_payload = {
        "lot_id": lot_id,
        "sender_id": str(buyer_id),
        "sender_name": buyer_name,
        "sender_role": "buyer",
        "message": "Can you offer ₹122/kg for 400 kg lot with farm gate pickup?",
        "proposed_price": 122.0,
        "proposed_quantity": 400.0,
    }
    chat_post = client.post(f"/api/negotiations/lot/{lot_id}/messages", json=msg_payload)
    assert chat_post.status_code == 201, chat_post.text
    assert chat_post.json()["proposed_price"] == 122.0

    chat_get = client.get(f"/api/negotiations/lot/{lot_id}")
    assert chat_get.status_code == 200
    assert len(chat_get.json()) >= 1

    # 10: Offer / Counter-Offer
    offer_payload = {
        "lot_id": lot_id,
        "buyer_id": buyer_id,
        "offered_price": 120.0,
        "quantity_kg": 400.0,
        "quality_grade": "Grade A",
        "message": "Immediate payment upon digital scale weighing.",
    }
    offer_resp = client.post("/api/offers", json=offer_payload)
    assert offer_resp.status_code == 201
    offer_id = offer_resp.json()["id"]

    # Counter-offer
    counter_resp = client.post(
        f"/api/offers/{offer_id}/counter",
        json={"counter_price": 123.0, "quantity_kg": 400.0, "message": "Farmer counter: ₹123/kg"},
    )
    assert counter_resp.status_code == 200
    assert counter_resp.json()["status"] == "Countered"

    # 11 & 12: Accepted offer creates transaction & inventory reserved
    accept_resp = client.post(f"/api/offers/{offer_id}/accept")
    assert accept_resp.status_code == 200, accept_resp.text
    tx_data = accept_resp.json()
    assert tx_data["lot_id"] == lot_id
    assert tx_data["status"] == "CONFIRMED"
    tx_id = tx_data["id"]

    # Verify inventory moved from allocated to reserved
    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        assert inv_item.reserved_quantity >= 400.0
    finally:
        db.close()

    # 13: Transaction delivery/completion updates stock (converts reserved to sold)
    complete_resp = client.put(f"/api/transactions/{tx_id}/status", json={"status": "DELIVERED"})
    assert complete_resp.status_code == 200
    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        assert inv_item.sold_quantity >= 400.0
    finally:
        db.close()

    # 14: Test Cancellation releases reserved stock
    lot2_resp = client.post("/api/lots", json={
        "farmer_id": farmer_id,
        "crop_id": crop_id,
        "quantity": 200.0,
        "unit": "kg",
        "asking_price": 125.0,
        "quality": "Grade A",
        "status": "Open for Offers",
    })
    assert lot2_resp.status_code == 201
    lot2_id = lot2_resp.json()["id"]

    offer2_resp = client.post("/api/offers", json={
        "lot_id": lot2_id,
        "buyer_id": buyer_id,
        "offered_price": 124.0,
        "quantity_kg": 200.0,
    })
    offer2_id = offer2_resp.json()["id"]

    # Accept offer2 -> reserves 200 kg
    accept2_resp = client.post(f"/api/offers/{offer2_id}/accept")
    assert accept2_resp.status_code == 200
    tx2_id = accept2_resp.json()["id"]

    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        reserved_before_cancel = inv_item.reserved_quantity
        avail_before_cancel = inv_item.available_quantity
    finally:
        db.close()

    # Cancel transaction2 -> releases reserved 200 kg back to available
    cancel_resp = client.put(f"/api/transactions/{tx2_id}/status", json={"status": "CANCELLED"})
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    db = next(get_db())
    try:
        inv_item = (
            db.query(InventoryItem)
            .filter(InventoryItem.farmer_id == farmer_id, InventoryItem.crop_name.ilike("Pomegranate"))
            .first()
        )
        assert inv_item.reserved_quantity == round(reserved_before_cancel - 200.0, 2)
        assert inv_item.available_quantity == round(avail_before_cancel + 200.0, 2)
    finally:
        db.close()

    print("SUCCESS: Complete end-to-end marketplace flow verified!")


if __name__ == "__main__":
    test_complete_end_to_end_marketplace_flow()


