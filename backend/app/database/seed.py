"""
Database Seeding Script for KissanSetuAI
Populates realistic Indian agricultural demo data (Farmer, Crops, Markets, Prices, Buyers, Lots, Offers, Transactions).
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, Base
from app.database.models import Farmer, Crop, Market, MarketPrice, Buyer, Lot, Offer, Transaction, SoilProfile


def seed_database(db: Session):
    print("[Seeder] Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # 1. Farmer
    existing_farmer = db.query(Farmer).filter(Farmer.phone == "+91 98765 43210").first()
    if not existing_farmer:
        print("[Seeder] Creating demo farmer: Ramesh Kumar...")
        farmer = Farmer(
            name="Ramesh Kumar",
            phone="+91 98765 43210",
            email="ramesh.kumar@agrimail.in",
            preferred_language="en",
            state="Maharashtra",
            district="Nashik",
            village="Dindori",
            latitude=20.011,
            longitude=73.790,
            created_at=datetime.utcnow()
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
    else:
        farmer = existing_farmer

    # 1.1 Soil Profile for Farmer
    existing_soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer.id).first()
    if not existing_soil:
        print("[Seeder] Seeding Soil Profile for Ramesh Kumar (Nashik Black Soil)...")
        soil = SoilProfile(
            farmer_id=farmer.id,
            soil_type="Black",
            ph=7.2,
            nitrogen=240.0,      # Slightly low N (typical for intensive vegetable tracts)
            phosphorus=18.5,     # Medium P
            potassium=295.0,     # High K (rich in black cotton soil)
            organic_carbon=0.58, # Medium OC %
            moisture=26.0,       # Adequate moisture %
            source="Soil Health Card (ICAR-Nashik)",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(soil)
        db.commit()


    # 2. Crops
    if db.query(Crop).filter(Crop.farmer_id == farmer.id).count() == 0:
        print("[Seeder] Seeding farmer crops: Tomato, Onion, Grapes...")
        crop_tomato = Crop(
            farmer_id=farmer.id,
            crop_name="Tomato",
            variety="Abhinav (Hybrid F1)",
            acreage=2.5,
            quantity=2400.0,
            sowing_date="2026-06-15",
            expected_harvest_date="2026-09-08",
            growth_stage="Near maturity (70-80% red)",
            soil_type="Black Cotton Soil",
            created_at=datetime.utcnow()
        )
        crop_onion = Crop(
            farmer_id=farmer.id,
            crop_name="Onion",
            variety="Bhima Super (Rabi)",
            acreage=4.0,
            quantity=6800.0,
            sowing_date="2026-05-10",
            expected_harvest_date="2026-09-22",
            growth_stage="Bulb enlargement stage",
            soil_type="Alluvial Loam",
            created_at=datetime.utcnow()
        )
        crop_grapes = Crop(
            farmer_id=farmer.id,
            crop_name="Grapes",
            variety="Thompson Seedless (Export Grade)",
            acreage=3.2,
            quantity=5000.0,
            sowing_date="2025-11-01",
            expected_harvest_date="2026-10-15",
            growth_stage="Berry elongation & sugar accumulation",
            soil_type="Sandy Loam with Drip Fertigation",
            created_at=datetime.utcnow()
        )
        db.add_all([crop_tomato, crop_onion, crop_grapes])
        db.commit()
        db.refresh(crop_tomato)
        db.refresh(crop_onion)
        db.refresh(crop_grapes)
    else:
        crops = db.query(Crop).filter(Crop.farmer_id == farmer.id).all()
        crop_tomato = next((c for c in crops if c.crop_name == "Tomato"), crops[0])
        crop_onion = next((c for c in crops if c.crop_name == "Onion"), crops[0])
        crop_grapes = next((c for c in crops if c.crop_name == "Grapes"), crops[0])

    # 3. Markets
    if db.query(Market).count() == 0:
        print("[Seeder] Seeding APMC mandis...")
        m_lasalgaon = Market(name="Lasalgaon APMC", district="Nashik", state="Maharashtra", latitude=20.147, longitude=74.225)
        m_nashik = Market(name="Nashik APMC", district="Nashik", state="Maharashtra", latitude=19.997, longitude=73.789)
        m_pune = Market(name="Pune APMC (Gultekdi)", district="Pune", state="Maharashtra", latitude=18.497, longitude=73.865)
        m_vashi = Market(name="Vashi APMC (Navi Mumbai)", district="Thane", state="Maharashtra", latitude=19.076, longitude=73.007)
        m_pimpalgaon = Market(name="Pimpalgaon Baswant APMC", district="Nashik", state="Maharashtra", latitude=20.170, longitude=73.980)

        db.add_all([m_lasalgaon, m_nashik, m_pune, m_vashi, m_pimpalgaon])
        db.commit()
        db.refresh(m_lasalgaon)
        db.refresh(m_nashik)
        db.refresh(m_pune)
        db.refresh(m_vashi)
        db.refresh(m_pimpalgaon)
    else:
        markets = db.query(Market).all()
        m_lasalgaon = next((m for m in markets if "Lasalgaon" in m.name), markets[0])
        m_nashik = next((m for m in markets if "Nashik" in m.name), markets[0])
        m_pune = next((m for m in markets if "Pune" in m.name), markets[0])
        m_vashi = next((m for m in markets if "Vashi" in m.name), markets[0])
        m_pimpalgaon = next((m for m in markets if "Pimpalgaon" in m.name), markets[0])

    if db.query(MarketPrice).count() == 0:
        # Market Prices (Seeding Current and Historical Series)
        print("[Seeder] Seeding mandi crop prices with historical series...")
        today = datetime.now()
        prices = []

        mandi_list = [
            (m_lasalgaon, {"Tomato": 28.50, "Onion": 19.50, "Grapes": 68.00}),
            (m_nashik, {"Tomato": 26.70, "Onion": 18.20, "Grapes": 64.00}),
            (m_pune, {"Tomato": 29.80, "Onion": 21.00, "Grapes": 72.00}),
            (m_vashi, {"Tomato": 32.00, "Onion": 23.50, "Grapes": 78.00}),
            (m_pimpalgaon, {"Tomato": 27.20, "Onion": 20.10, "Grapes": 66.00}),
        ]

        for m_obj, crop_map in mandi_list:
            for crop_k, base_p in crop_map.items():
                for day_offset in range(14, -1, -1):
                    d_date = (today - timedelta(days=day_offset)).strftime("%Y-%m-%d")
                    # Realistic minor fluctuation
                    p_modal = round(base_p - (day_offset * 0.15) + (1.2 if day_offset % 3 == 0 else -0.4), 2)
                    p_min = round(p_modal * 0.93, 2)
                    p_max = round(p_modal * 1.07, 2)
                    arrival_qtl = round(450.0 + (day_offset * 12.0), 0)

                    prices.append(
                        MarketPrice(
                            market_id=m_obj.id,
                            crop_name=crop_k,
                            price=p_modal,
                            modal_price=p_modal,
                            min_price=p_min,
                            max_price=p_max,
                            arrival_quantity=arrival_qtl,
                            source="APMC Mandi Bulletin (Demo Stream)",
                            unit="kg",
                            date=d_date
                        )
                    )

        db.add_all(prices)
        db.commit()


    # 4. Buyers
    if db.query(Buyer).count() == 0:
        print("[Seeder] Seeding institutional buyers & FPCs with Phase 6 attributes...")
        b1 = Buyer(
            name="Sahyadri Farms FPC",
            organization="Sahyadri Farmers Producer Co. Ltd.",
            location="Nashik, Maharashtra",
            phone="+91 98220 11223",
            email="procurement@sahyadrifarms.com",
            verified=True,
            verification_status="VERIFIED",
            rating=4.9,
            preferred_crops=["Tomato", "Grapes", "Pomegranate"],
            min_quantity_qtl=10.0,
            max_quantity_qtl=150.0,
            preferred_quality="Grade A",
            indicative_price_per_kg=29.00,
            payment_reliability_score=98.0,
            procurement_radius_km=120.0,
            business_type="Farmer Producer Company (FPC)"
        )
        b2 = Buyer(
            name="FreshToHome Supply",
            organization="FreshToHome Direct Ltd.",
            location="Mumbai / Nashik Hub",
            phone="+91 98330 44556",
            email="agri-desk@freshtohome.com",
            verified=True,
            verification_status="VERIFIED",
            rating=4.7,
            preferred_crops=["Tomato", "Onion", "Chilli"],
            min_quantity_qtl=5.0,
            max_quantity_qtl=80.0,
            preferred_quality="Grade A",
            indicative_price_per_kg=28.50,
            payment_reliability_score=95.0,
            procurement_radius_km=150.0,
            business_type="Direct-to-Consumer Retailer"
        )
        b3 = Buyer(
            name="Reliance Fresh Procurement",
            organization="Reliance Retail Agri Hub",
            location="Pune, Maharashtra",
            phone="+91 98440 77889",
            email="kisanops@ril.com",
            verified=True,
            verification_status="VERIFIED",
            rating=4.8,
            preferred_crops=["Onion", "Potato", "Tomato"],
            min_quantity_qtl=20.0,
            max_quantity_qtl=300.0,
            preferred_quality="Grade A",
            indicative_price_per_kg=21.00,
            payment_reliability_score=97.0,
            procurement_radius_km=200.0,
            business_type="Organized Retail Chain"
        )
        b4 = Buyer(
            name="BigBasket Direct Mandi Hub",
            organization="Innovative Retail Concepts",
            location="Nashik, Maharashtra",
            phone="+91 98110 33445",
            email="mandi@bigbasket.com",
            verified=True,
            verification_status="VERIFIED",
            rating=4.6,
            preferred_crops=["Tomato", "Onion", "Capsicum"],
            min_quantity_qtl=10.0,
            max_quantity_qtl=100.0,
            preferred_quality="Grade A",
            indicative_price_per_kg=28.20,
            payment_reliability_score=94.0,
            procurement_radius_km=80.0,
            business_type="E-Grocery Procurement Hub"
        )
        b5 = Buyer(
            name="Mahaveer Agro Traders",
            organization="APMC Licensed Trader #412",
            location="Lasalgaon, Maharashtra",
            phone="+91 98550 99001",
            email="mahaveertraders@agrimandi.in",
            verified=False,
            verification_status="PENDING",
            rating=4.4,
            preferred_crops=["Onion", "Soybean", "Wheat"],
            min_quantity_qtl=15.0,
            max_quantity_qtl=200.0,
            preferred_quality="Grade B+",
            indicative_price_per_kg=19.80,
            payment_reliability_score=88.0,
            procurement_radius_km=60.0,
            business_type="APMC Commission Agent"
        )

        db.add_all([b1, b2, b3, b4, b5])
        db.commit()
        db.refresh(b1)
        db.refresh(b2)
        db.refresh(b3)
        db.refresh(b4)
        db.refresh(b5)
    else:
        b1 = db.query(Buyer).filter(Buyer.name.ilike("%Sahyadri%")).first()
        b2 = db.query(Buyer).filter(Buyer.name.ilike("%FreshToHome%")).first()
        b3 = db.query(Buyer).filter(Buyer.name.ilike("%Reliance%")).first()
        b4 = db.query(Buyer).filter(Buyer.name.ilike("%BigBasket%")).first()
        b5 = db.query(Buyer).filter(Buyer.name.ilike("%Mahaveer%")).first()

    # 5. Lots
    if db.query(Lot).count() == 0:
        print("[Seeder] Seeding harvest marketplace lots...")
        lot1 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_tomato.id,
            quantity=2000.0,
            unit="kg",
            asking_price=29.00,
            quality="Grade A",
            quality_description="Firm table quality, 80% red color, 55-65mm diameter, zero pest puncture",
            harvest_date="2026-09-08",
            harvest_window="Within 2-3 days",
            location="Nashik (Dindori Aggregation Center)",
            status="Open for Offers",
            created_at=datetime.utcnow()
        )
        lot2 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_onion.id,
            buyer_id=b3.id if b3 else None,
            quantity=4000.0,
            unit="kg",
            asking_price=20.00,
            quality="Grade A",
            quality_description="Uniform cured red onions, 45-55mm diameter, dry outer skin",
            harvest_date="2026-09-04",
            harvest_window="Immediate delivery",
            location="Lasalgaon Mandi Yard Gate #2",
            status="IN_TRANSIT",
            created_at=datetime.utcnow()
        )
        lot3 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_grapes.id,
            buyer_id=b1.id if b1 else None,
            quantity=1500.0,
            unit="kg",
            asking_price=65.00,
            quality="Grade A",
            quality_description="Export Grade Thompson Seedless, Brix > 17°, berry size 18mm+",
            harvest_date="2026-09-02",
            harvest_window="Completed",
            location="Nashik Cold Chain Hub #3",
            status="COMPLETED",
            created_at=datetime.utcnow()
        )
        db.add_all([lot1, lot2, lot3])
        db.commit()
        db.refresh(lot1)
        db.refresh(lot2)
        db.refresh(lot3)

        # 6. Offers
        print("[Seeder] Seeding buyer bids and offers with negotiation history...")
        offer1 = Offer(
            lot_id=lot1.id,
            buyer_id=b1.id if b1 else 1,
            offered_price=29.00,
            quantity_kg=2000.0,
            quality_grade="Grade A",
            message="We can pick up from your farm gate on Wednesday morning. Immediate payment upon quality inspection.",
            status="Pending",
            created_at=datetime.utcnow()
        )
        offer2 = Offer(
            lot_id=lot1.id,
            buyer_id=b2.id if b2 else 2,
            offered_price=28.50,
            counter_price=29.50,
            quantity_kg=2000.0,
            quality_grade="Grade A",
            message="Initial offer ₹28.50/kg. Farmer countered with ₹29.50/kg.",
            status="Countered",
            created_at=datetime.utcnow()
        )
        offer3 = Offer(
            lot_id=lot2.id,
            buyer_id=b3.id if b3 else 3,
            offered_price=20.00,
            quantity_kg=4000.0,
            quality_grade="Grade A",
            message="Procurement confirmed for Reliance Fresh Pune Distribution Hub.",
            status="Accepted",
            created_at=datetime.utcnow()
        )
        db.add_all([offer1, offer2, offer3])
        db.commit()
        db.refresh(offer1)
        db.refresh(offer2)
        db.refresh(offer3)

        # 7. Transactions
        print("[Seeder] Seeding completed transactions, logistics, and audit timeline...")
        tx1 = Transaction(
            lot_id=lot2.id,
            farmer_id=farmer.id,
            buyer_id=b3.id if b3 else 3,
            offer_id=offer3.id,
            quantity_kg=4000.0,
            final_price=20.00,
            total_amount=80000.0,
            status="IN_TRANSIT",
            logistics_status="IN_TRANSIT",
            pickup_date="2026-09-05 08:30 AM",
            pickup_location="Lasalgaon Yard Gate #2",
            delivery_location="Reliance Fresh Pune Hub, Hadapsar",
            transport_cost_actual=3200.0,
            payment_status="PENDING",
            expected_amount=80000.0,
            paid_amount=0.0
        )
        tx2 = Transaction(
            lot_id=lot3.id,
            farmer_id=farmer.id,
            buyer_id=b1.id if b1 else 1,
            quantity_kg=1500.0,
            final_price=65.00,
            total_amount=97500.0,
            status="COMPLETED",
            logistics_status="DELIVERED",
            pickup_date="2026-09-02 09:00 AM",
            pickup_location="Nashik Farm Gate",
            delivery_location="Sahyadri Cold Chain Hub #3",
            transport_cost_actual=1200.0,
            payment_status="RECEIVED",
            expected_amount=97500.0,
            paid_amount=97500.0,
            payment_date="2026-09-03",
            payment_reference="NEFT-KISSAN-78921"
        )
        db.add_all([tx1, tx2])
        db.commit()
        db.refresh(tx1)
        db.refresh(tx2)

        # Transaction Events Audit Trail
        ev1 = TransactionEvent(transaction_id=tx1.id, stage_label="Offer Accepted", description="Farmer accepted Reliance Fresh offer at ₹20.00/kg", done=True)
        ev2 = TransactionEvent(transaction_id=tx1.id, stage_label="Transaction Confirmed", description="Contract generated for 4,000 kg cured onion", done=True)
        ev3 = TransactionEvent(transaction_id=tx1.id, stage_label="Pickup Scheduled", description="Logistics truck MH-15-EG-4412 scheduled for Sep 5, 8:30 AM", done=True)
        ev4 = TransactionEvent(transaction_id=tx1.id, stage_label="Produce Picked Up", description="Produce loaded at Lasalgaon Mandi Yard Gate #2", done=True)
        ev5 = TransactionEvent(transaction_id=tx1.id, stage_label="In Transit", description="Truck in transit to Pune Distribution Hub", done=True)

        ev_c1 = TransactionEvent(transaction_id=tx2.id, stage_label="Offer Accepted", description="Accepted Sahyadri Farms FPC offer at ₹65.00/kg", done=True)
        ev_c2 = TransactionEvent(transaction_id=tx2.id, stage_label="Delivered & Verified", description="Delivered to Cold Chain Hub; Brix test passed at 17.8°", done=True)
        ev_c3 = TransactionEvent(transaction_id=tx2.id, stage_label="Payment Settled", description="₹97,500 direct bank transfer recorded (Ref: NEFT-KISSAN-78921)", done=True)

        db.add_all([ev1, ev2, ev3, ev4, ev5, ev_c1, ev_c2, ev_c3])
        db.commit()

    print("[Seeder] Database successfully populated with realistic Indian agricultural demo data!")


def seed_database_if_empty(db: Session):
    """Called automatically on server startup if no farmers exist."""
    farmer_count = db.query(Farmer).count()
    if farmer_count == 0:
        seed_database(db)


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
