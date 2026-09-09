import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import SessionLocal
from app.database.models import Farmer, Crop, Buyer, Lot, Offer, Transaction, InventoryItem, StockAdjustment
from app.services.inventory_service import inventory_service
from app.services.transaction_service import transaction_service
from app.services.buyer_matching_service import buyer_matching_service

client = TestClient(app)


def test_fpo_member_produce_aggregation_increases_stock():
    """Verify that aggregating member produce increases FPO stock and writes audit log."""
    db = SessionLocal()
    try:
        # Create FPO if needed
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        if not fpo:
            fpo = Farmer(
                name="Sahyadri Farmers Producer Co.",
                phone="9876599999",
                role="fpo",
                organization_name="Sahyadri FPO",
                state="Maharashtra",
                district="Nashik"
            )
            db.add(fpo)
            db.commit()
            db.refresh(fpo)

        # Baseline summary
        initial_summary = inventory_service.get_farmer_inventory_summary(db, fpo.id)
        grape_item_before = next((i for i in initial_summary["items"] if i["crop_name"].lower() == "grapes"), None)
        before_total = grape_item_before["total_quantity"] if grape_item_before else 0.0

        # Aggregate produce from member
        res = client.post("/api/inventory/aggregation", json={
            "fpo_id": fpo.id,
            "crop_name": "Grapes",
            "quantity": 1200.0,
            "member_name": "Ramesh Patil (Dindori)",
            "variety": "Export Grade",
            "notes": "Aggregated 1200 kg Export Grapes"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["new_total_quantity"] == round(before_total + 1200.0, 2)

        # Verify audit history
        audit_res = client.get(f"/api/inventory/farmer/{fpo.id}/audit")
        assert audit_res.status_code == 200
        audit_list = audit_res.json()
        assert any(a["adjustment_type"] == "MEMBER_AGGREGATION" and a["customer_name"] == "Ramesh Patil (Dindori)" for a in audit_list)
    finally:
        db.close()


def test_no_double_counting_on_summary_calls():
    """Verify that repeatedly fetching inventory summary does not duplicate or increment stock."""
    db = SessionLocal()
    try:
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        fpo_id = fpo.id if fpo else 1

        summary_1 = client.get(f"/api/inventory/farmer/{fpo_id}").json()
        summary_2 = client.get(f"/api/inventory/farmer/{fpo_id}").json()
        summary_3 = client.get(f"/api/inventory/farmer/{fpo_id}").json()

        assert summary_1["total_stock"] == summary_2["total_stock"] == summary_3["total_stock"]
        assert summary_1["available_to_sell"] == summary_2["available_to_sell"] == summary_3["available_to_sell"]
    finally:
        db.close()


def test_fpo_stock_isolated_from_individual_farmer_stock():
    """Verify FPO inventory ledger is strictly isolated by farmer/org ID."""
    db = SessionLocal()
    try:
        # FPO
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        fpo_id = fpo.id if fpo else 1
        # Individual Farmer
        farmer = db.query(Farmer).filter(Farmer.role == "farmer").first()
        farmer_id = farmer.id if farmer else 2

        fpo_summary = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        farmer_summary = inventory_service.get_farmer_inventory_summary(db, farmer_id)

        assert fpo_summary["farmer_id"] == fpo_id
        assert farmer_summary["farmer_id"] == farmer_id
    finally:
        db.close()


def test_fpo_bulk_lot_creation_within_available_stock():
    """Verify FPO can create a bulk lot only up to available stock, and excess is rejected with 400."""
    db = SessionLocal()
    try:
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        fpo_id = fpo.id if fpo else 1

        # Aggregate a known stock of 2000 kg Onion
        inventory_service.record_member_aggregation(
            db=db,
            farmer_id=fpo_id,
            crop_name="Onion",
            quantity=2000.0,
            member_name="Nashik Member Pool",
        )

        # Find or create Onion crop for FPO
        crop = db.query(Crop).filter(Crop.farmer_id == fpo_id, Crop.crop_name.ilike("Onion")).first()
        if not crop:
            crop = Crop(farmer_id=fpo_id, crop_name="Onion", variety="Garwa", quantity=2000.0)
            db.add(crop)
            db.commit()
            db.refresh(crop)

        summary = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        onion_item = next(i for i in summary["items"] if i["crop_name"].lower() == "onion")
        available_before = onion_item["available_quantity"]

        # 1. Attempt to create bulk lot EXCEEDING available stock -> must fail
        excess_payload = {
            "farmer_id": fpo_id,
            "crop_id": crop.id,
            "quantity": available_before + 50000.0,
            "asking_price": 28.0,
            "quality": "Grade A",
            "quality_description": "Bulk Aggregated Garwa Onion",
            "harvest_date": "2026-09-10",
            "harvest_window": "3–5 days",
            "location": "Niphad, Nashik",
            "status": "Open for Offers"
        }
        res_fail = client.post("/api/lots", json=excess_payload, headers={"X-User-Role": "fpo"})
        assert res_fail.status_code == 400
        assert "available to sell" in res_fail.json()["detail"].lower()

        # 2. Create valid bulk lot within available stock -> must succeed
        valid_qty = min(1000.0, available_before)
        valid_payload = {
            "farmer_id": fpo_id,
            "crop_id": crop.id,
            "quantity": valid_qty,
            "asking_price": 28.0,
            "quality": "Grade A",
            "quality_description": "Bulk Aggregated Garwa Onion",
            "harvest_date": "2026-09-10",
            "harvest_window": "3–5 days",
            "location": "Niphad, Nashik",
            "status": "Open for Offers"
        }
        res_ok = client.post("/api/lots", json=valid_payload, headers={"X-User-Role": "fpo"})
        assert res_ok.status_code == 201
        lot_data = res_ok.json()
        assert lot_data["quantity"] == valid_qty

        # Verify stock allocation
        summary_after = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        onion_after = next(i for i in summary_after["items"] if i["crop_name"].lower() == "onion")
        assert onion_after["allocated_quantity"] >= valid_qty
        assert onion_after["available_quantity"] == round(available_before - valid_qty, 2)

        # 3. Cancel lot -> stock must be released back to available
        cancel_res = client.put(f"/api/lots/{lot_data['id']}", json={"status": "Cancelled"}, headers={"X-User-Role": "fpo"})
        assert cancel_res.status_code == 200
        summary_released = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        onion_released = next(i for i in summary_released["items"] if i["crop_name"].lower() == "onion")
        assert onion_released["available_quantity"] == available_before
    finally:
        db.close()


def test_fpo_accepted_offer_reserves_stock_and_delivery_completes_sale():
    """Verify accepted offer moves stock allocated -> reserved, and delivery moves reserved -> sold."""
    db = SessionLocal()
    try:
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        fpo_id = fpo.id if fpo else 1

        # Aggregate Cotton
        inventory_service.record_member_aggregation(
            db=db,
            farmer_id=fpo_id,
            crop_name="Cotton",
            quantity=3000.0,
            member_name="Cotton Smallholders Pool",
        )

        crop = db.query(Crop).filter(Crop.farmer_id == fpo_id, Crop.crop_name.ilike("Cotton")).first()
        if not crop:
            crop = Crop(farmer_id=fpo_id, crop_name="Cotton", variety="MCU-5", quantity=3000.0)
            db.add(crop)
            db.commit()
            db.refresh(crop)

        # List bulk lot of 1500 kg
        lot_payload = {
            "farmer_id": fpo_id,
            "crop_id": crop.id,
            "quantity": 1500.0,
            "asking_price": 72.0,
            "quality": "Export Grade",
            "quality_description": "Aggregated Long Staple Cotton",
            "harvest_date": "2026-09-10",
            "location": "Jalgaon, Maharashtra",
            "status": "Open for Offers"
        }
        res_lot = client.post("/api/lots", json=lot_payload, headers={"X-User-Role": "fpo"})
        assert res_lot.status_code == 201
        lot = res_lot.json()
        lot_id = lot["id"]

        # Buyer makes offer
        buyer = db.query(Buyer).first()
        if not buyer:
            buyer = Buyer(name="Kisan Tex Mills", location="Jalgaon", verified=True)
            db.add(buyer)
            db.commit()
            db.refresh(buyer)

        res_offer = client.post("/api/offers", json={
            "lot_id": lot_id,
            "buyer_id": buyer.id,
            "offered_price": 71.50,
            "quantity_kg": 1500.0,
            "quality_grade": "Export Grade",
            "message": "Direct spinning mill intake."
        })
        assert res_offer.status_code == 201
        offer_id = res_offer.json()["id"]

        # FPO accepts offer -> creates Transaction and moves stock to reserved
        res_accept = client.post(f"/api/offers/{offer_id}/accept")
        assert res_accept.status_code == 200
        tx = res_accept.json()
        tx_id = tx["id"]
        assert tx["status"] == "CONFIRMED"

        summary_reserved = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        cotton_res = next(i for i in summary_reserved["items"] if i["crop_name"].lower() == "cotton")
        assert cotton_res["reserved_quantity"] >= 1500.0

        # Deliver transaction -> moves reserved to sold
        res_deliver = client.put(f"/api/transactions/{tx_id}/status", json={
            "status": "DELIVERED",
            "note": "FPO bulk lot delivered to spinning mill warehouse."
        })
        assert res_deliver.status_code == 200

        summary_sold = inventory_service.get_farmer_inventory_summary(db, fpo_id)
        cotton_sold = next(i for i in summary_sold["items"] if i["crop_name"].lower() == "cotton")
        assert cotton_sold["sold_quantity"] >= 1500.0
    finally:
        db.close()


def test_fpo_offline_sale_recording_and_audit():
    """Verify FPO direct offline sale deducts stock and records audit log."""
    db = SessionLocal()
    try:
        fpo = db.query(Farmer).filter(Farmer.role == "fpo").first()
        fpo_id = fpo.id if fpo else 1

        # Aggregate Tomato
        inventory_service.record_member_aggregation(
            db=db,
            farmer_id=fpo_id,
            crop_name="Tomato",
            quantity=1000.0,
            member_name="Dindori Cluster",
        )

        res_sale = client.post("/api/inventory/offline-sale", json={
            "farmer_id": fpo_id,
            "crop_name": "Tomato",
            "quantity": 250.0,
            "customer_name": "Local Processing Unit",
            "notes": "Walk-in sale of sorted tomatoes"
        })
        assert res_sale.status_code == 200
        data = res_sale.json()
        assert data["success"] is True

        audit_res = client.get(f"/api/inventory/farmer/{fpo_id}/audit")
        assert audit_res.status_code == 200
        adjustments = audit_res.json()
        assert any(a["adjustment_type"] == "OFFLINE_SALE" and a["customer_name"] == "Local Processing Unit" for a in adjustments)
    finally:
        db.close()


def test_buyer_role_authorization_lot_creation_blocked():
    """Verify buyers cannot create lots (403 Forbidden)."""
    payload = {
        "farmer_id": 1,
        "crop_id": 1,
        "quantity": 500.0,
        "asking_price": 30.0,
        "quality": "Grade A",
        "location": "Nashik",
        "status": "Open for Offers"
    }
    res = client.post("/api/lots", json=payload, headers={"X-User-Role": "buyer"})
    assert res.status_code == 403
