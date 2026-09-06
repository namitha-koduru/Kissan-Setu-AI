"""
Database Seeding Script for KissanSetuAI
Populates realistic Indian agricultural demo data (Farmer, Crops, Markets, Prices, Buyers, Lots, Offers, Transactions).
"""

from datetime import datetime
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
        print("[Seeder] Seeding institutional buyers & FPCs...")
        b1 = Buyer(name="Sahyadri Farms FPC", organization="Sahyadri Farmers Producer Co. Ltd.", location="Nashik, Maharashtra", phone="+91 98220 11223", email="procurement@sahyadrifarms.com", verified=True, rating=4.9)
        b2 = Buyer(name="FreshToHome Supply", organization="FreshToHome Direct Ltd.", location="Mumbai / Nashik Hub", phone="+91 98330 44556", email="agri-desk@freshtohome.com", verified=True, rating=4.7)
        b3 = Buyer(name="Reliance Fresh Procurement", organization="Reliance Retail Agri Hub", location="Pune, Maharashtra", phone="+91 98440 77889", email="kisanops@ril.com", verified=True, rating=4.8)
        b4 = Buyer(name="BigBasket Direct Mandi Hub", organization="Innovative Retail Concepts", location="Nashik, Maharashtra", phone="+91 98110 33445", email="mandi@bigbasket.com", verified=True, rating=4.6)
        b5 = Buyer(name="Mahaveer Agro Traders", organization="APMC Licensed Trader #412", location="Lasalgaon, Maharashtra", phone="+91 98550 99001", email="mahaveertraders@agrimandi.in", verified=True, rating=4.4)

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

    # 5. Lots
    if db.query(Lot).count() == 0:
        print("[Seeder] Seeding harvest marketplace lots...")
        lot1 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_tomato.id,
            quantity=2400.0,
            asking_price=24.00,
            quality="Grade A (Firm, 75% red)",
            harvest_date="2026-09-08",
            location="Nashik (Dindori Aggregation Center)",
            status="Open for Offers",
            created_at=datetime.utcnow()
        )
        lot2 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_onion.id,
            buyer_id=b3.id if b3 else None,
            quantity=4000.0,
            asking_price=19.00,
            quality="Grade A (Uniform Cured)",
            harvest_date="2026-09-04",
            location="Lasalgaon Mandi Yard Gate #2",
            status="In Transit",
            created_at=datetime.utcnow()
        )
        lot3 = Lot(
            farmer_id=farmer.id,
            crop_id=crop_grapes.id,
            buyer_id=b1.id if b1 else None,
            quantity=1500.0,
            asking_price=55.00,
            quality="Export Grade (Brix > 17°)",
            harvest_date="2026-09-02",
            location="Nashik Cold Chain Hub #3",
            status="Settled",
            created_at=datetime.utcnow()
        )
        db.add_all([lot1, lot2, lot3])
        db.commit()
        db.refresh(lot1)
        db.refresh(lot2)
        db.refresh(lot3)

        # 6. Offers
        print("[Seeder] Seeding buyer bids and offers...")
        offer1 = Offer(lot_id=lot1.id, buyer_id=b1.id if b1 else 1, offered_price=24.50, status="Pending")
        offer2 = Offer(lot_id=lot1.id, buyer_id=b2.id if b2 else 2, offered_price=23.80, status="Countered")
        offer3 = Offer(lot_id=lot2.id, buyer_id=b3.id if b3 else 3, offered_price=19.50, status="Accepted")
        db.add_all([offer1, offer2, offer3])
        db.commit()

        # 7. Transactions
        print("[Seeder] Seeding completed transactions & escrow settlements...")
        tx1 = Transaction(lot_id=lot2.id, final_price=19.50 * 4000.0, status="Escrow Locked - In Transit")
        tx2 = Transaction(lot_id=lot3.id, final_price=56.00 * 1500.0, status="Settled - Credited to Bank")
        db.add_all([tx1, tx2])
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
