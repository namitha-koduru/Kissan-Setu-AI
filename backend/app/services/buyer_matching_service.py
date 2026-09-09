import math
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import Buyer, MarketPrice, Lot, Farmer
from app.schemas.buyer_matching import (
    BuyerMatchResult,
    BuyerMatchingResponse,
    BuyerMatchFactor,
    DirectVsMandiComparison,
)

# Known coordinates for Indian Agricultural districts (latitude, longitude)
DISTRICT_COORDINATES: Dict[str, Tuple[float, float]] = {
    "nashik": (19.9975, 73.7898),
    "pune": (18.5204, 73.8567),
    "ahmednagar": (19.0952, 74.7496),
    "aurangabad": (19.8762, 75.3433),
    "chhatrapati sambhajinagar": (19.8762, 75.3433),
    "jalgaon": (21.0077, 75.5626),
    "solapur": (17.6599, 75.9064),
    "satara": (17.6805, 74.0183),
    "sangli": (16.8524, 74.5815),
    "kolhapur": (16.7050, 74.2433),
    "nagpur": (21.1458, 79.0882),
    "amravati": (20.9374, 77.7796),
    "latur": (18.4088, 76.5604),
    "nanded": (19.1383, 77.3210),
    "mumbai": (19.0760, 72.8777),
    "thane": (19.2183, 72.9781),
    "hyderabad": (17.3850, 78.4867),
    "bengaluru": (12.9716, 77.5946),
    "surat": (21.1702, 72.8311),
    "indore": (22.7196, 75.8577),
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def get_coords_from_location(location_str: Optional[str]) -> Optional[Tuple[float, float]]:
    if not location_str:
        return None
    loc_lower = location_str.lower()
    for district, coords in DISTRICT_COORDINATES.items():
        if district in loc_lower:
            return coords
    return None



class BuyerMatchingService:
    """
    Smart Buyer Matching Engine.
    Ranks institutional buyers and FPCs for a farmer's produce using a transparent,
    explainable 7-factor weighted scoring model (0-100).
    Calculates direct buyer vs APMC mandi net realization differentials.
    """

    def get_mandi_benchmark_price(self, db: Session, crop_name: str) -> float:
        """Fetch latest modal mandi price for the crop or realistic benchmark fallback."""
        latest_price = (
            db.query(MarketPrice)
            .filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))
            .order_by(MarketPrice.date.desc())
            .first()
        )
        if latest_price:
            return float(latest_price.modal_price or latest_price.price)
        # Fallbacks for staple crops
        fallbacks = {
            "Tomato": 27.20,
            "Onion": 19.50,
            "Grapes": 65.00,
            "Pomegranate": 85.00,
            "Wheat": 24.00,
            "Soybean": 42.00,
            "Cotton": 62.00,
            "Potato": 18.00,
        }
        return fallbacks.get(crop_name, 25.00)

    def calculate_direct_vs_mandi_comparison(
        self,
        crop_name: str,
        quantity_qtl: float,
        buyer_name: str,
        buyer_indicative_price: float,
        mandi_benchmark_price: float,
        mandi_distance_km: float = 35.0,
        buyer_distance_km: float = 25.0,
    ) -> DirectVsMandiComparison:
        quantity_kg = quantity_qtl * 100.0

        # Direct Buyer Route (Often farm-gate pickup with lower freight and 0% APMC cess)
        direct_gross = quantity_kg * buyer_indicative_price
        direct_transport = round(quantity_qtl * 2.2 * buyer_distance_km, 2)
        direct_other_fees = 0.0  # 0% APMC cess on direct procurement
        direct_net = round(direct_gross - direct_transport - direct_other_fees, 2)
        direct_net_per_kg = round(direct_net / quantity_kg, 2)

        # APMC Mandi Route (Mandi cess 1.5%, handling ₹18/qtl, freight)
        mandi_gross = quantity_kg * mandi_benchmark_price
        mandi_transport = round(quantity_qtl * 3.5 * mandi_distance_km, 2)
        mandi_cess = round(mandi_gross * 0.015, 2)
        mandi_handling = round(quantity_qtl * 18.0, 2)
        mandi_fees_total = mandi_cess + mandi_handling
        mandi_net = round(mandi_gross - mandi_transport - mandi_fees_total, 2)
        mandi_net_per_kg = round(mandi_net / quantity_kg, 2)

        advantage_total = round(direct_net - mandi_net, 2)
        advantage_per_kg = round(direct_net_per_kg - mandi_net_per_kg, 2)

        recommended = "DIRECT_BUYER" if advantage_total >= 0 else "APMC_MANDI"
        if advantage_total > 0:
            insight = f"Direct sale to {buyer_name} provides an estimated +₹{advantage_total:,.2f} (+₹{advantage_per_kg:.2f}/kg) higher net in-hand realization than local APMC mandi due to zero mandi cess and subsidized freight."
        else:
            insight = f"APMC Mandi route offers an estimated +₹{abs(advantage_total):,.2f} (+₹{abs(advantage_per_kg):.2f}/kg) higher return despite mandi cess."

        return DirectVsMandiComparison(
            crop_name=crop_name,
            quantity_qtl=quantity_qtl,
            quantity_kg=quantity_kg,
            direct_buyer_name=buyer_name,
            direct_offer_price_per_kg=buyer_indicative_price,
            direct_gross_revenue=direct_gross,
            direct_transport_cost=direct_transport,
            direct_other_fees=direct_other_fees,
            direct_net_realization=direct_net,
            direct_net_per_kg=direct_net_per_kg,
            mandi_name="Lasalgaon/Nashik APMC Mandi",
            mandi_price_per_kg=mandi_benchmark_price,
            mandi_gross_revenue=mandi_gross,
            mandi_transport_cost=mandi_transport,
            mandi_handling_and_cess=mandi_fees_total,
            mandi_net_realization=mandi_net,
            mandi_net_per_kg=mandi_net_per_kg,
            net_advantage_total=advantage_total,
            net_advantage_per_kg=advantage_per_kg,
            recommended_channel=recommended,
            insight=insight,
        )

    def evaluate_buyer_match(
        self,
        buyer: Buyer,
        crop_name: str,
        quantity_qtl: float,
        quality_grade: str,
        farmer_location: str,
        mandi_benchmark: float,
    ) -> BuyerMatchResult:
        factors: List[BuyerMatchFactor] = []
        reasons: List[str] = []
        warnings: List[str] = []

        # 1. Crop Match (25 pts)
        crop_score = 0.0
        pref_crops = buyer.preferred_crops or []
        if isinstance(pref_crops, list) and any(crop_name.lower() in str(c).lower() for c in pref_crops):
            crop_score = 25.0
            reasons.append(f"Actively procuring {crop_name}")
            factors.append(BuyerMatchFactor(factor_name="Crop Requirement", score=25.0, max_score=25.0, explanation=f"Directly demanding {crop_name}"))
        else:
            # General buyer
            crop_score = 12.0
            factors.append(BuyerMatchFactor(factor_name="Crop Requirement", score=12.0, max_score=25.0, explanation="General multi-crop procurer", is_positive=False))
            warnings.append(f"{crop_name} is not explicitly listed in primary procurement list")

        # 2. Quantity Demand Range (20 pts)
        min_q = buyer.min_quantity_qtl or 5.0
        max_q = buyer.max_quantity_qtl or 200.0
        qty_score = 0.0
        if min_q <= quantity_qtl <= max_q:
            qty_score = 20.0
            reasons.append(f"Your {quantity_qtl} quintals fits procurement demand ({min_q}–{max_q} Qtl)")
            factors.append(BuyerMatchFactor(factor_name="Quantity Compatibility", score=20.0, max_score=20.0, explanation=f"Volume ({quantity_qtl} Qtl) aligns with buyer capacity ({min_q}–{max_q} Qtl)"))
        elif quantity_qtl < min_q:
            qty_score = 10.0
            warnings.append(f"Produce volume ({quantity_qtl} Qtl) is below minimum lot size ({min_q} Qtl)")
            factors.append(BuyerMatchFactor(factor_name="Quantity Compatibility", score=10.0, max_score=20.0, explanation=f"Below minimum tender requirement ({min_q} Qtl)", is_positive=False))
        else:
            qty_score = 14.0
            reasons.append(f"Demand capacity accommodates substantial volume ({max_q} Qtl max)")
            factors.append(BuyerMatchFactor(factor_name="Quantity Compatibility", score=14.0, max_score=20.0, explanation=f"Exceeds single lot threshold ({max_q} Qtl)"))

        # 3. Price Competitiveness vs Mandi (20 pts)
        indicative_price = buyer.indicative_price_per_kg or (mandi_benchmark + 1.0)
        price_diff = indicative_price - mandi_benchmark
        if price_diff >= 1.5:
            price_score = 20.0
            reasons.append(f"Indicative offer ₹{indicative_price:.2f}/kg is +₹{price_diff:.2f}/kg above mandi benchmark")
            factors.append(BuyerMatchFactor(factor_name="Price Competitiveness", score=20.0, max_score=20.0, explanation=f"Premium rate +₹{price_diff:.2f}/kg above mandi"))
        elif price_diff >= 0.0:
            price_score = 16.0
            reasons.append(f"Competitive rate ₹{indicative_price:.2f}/kg matching current mandi benchmark")
            factors.append(BuyerMatchFactor(factor_name="Price Competitiveness", score=16.0, max_score=20.0, explanation=f"Competitive at ₹{indicative_price:.2f}/kg"))
        else:
            price_score = 8.0
            warnings.append(f"Indicative price ₹{indicative_price:.2f}/kg is below mandi benchmark (₹{mandi_benchmark:.2f}/kg)")
            factors.append(BuyerMatchFactor(factor_name="Price Competitiveness", score=8.0, max_score=20.0, explanation=f"Discounted rate (-₹{abs(price_diff):.2f}/kg vs mandi)", is_positive=False))

        # 4. Quality Grade Compatibility (15 pts)
        pref_quality = buyer.preferred_quality or "Grade A"
        if quality_grade.lower() in pref_quality.lower() or "grade a" in quality_grade.lower():
            quality_score = 15.0
            reasons.append(f"Produce quality ({quality_grade}) meets buyer specifications ({pref_quality})")
            factors.append(BuyerMatchFactor(factor_name="Quality Specification", score=15.0, max_score=15.0, explanation=f"Matches required {pref_quality} standard"))
        else:
            quality_score = 8.0
            warnings.append(f"Buyer prefers {pref_quality}; may require grading inspection")
            factors.append(BuyerMatchFactor(factor_name="Quality Specification", score=8.0, max_score=15.0, explanation=f"Quality requires confirmation against {pref_quality}", is_positive=False))

        # 5. Verification Status (10 pts)
        v_status = buyer.verification_status or ("VERIFIED" if buyer.verified else "UNVERIFIED")
        if v_status == "VERIFIED":
            verif_score = 10.0
            reasons.append("✓ Verified Institutional Buyer (KYC & APMC License on file)")
            factors.append(BuyerMatchFactor(factor_name="Buyer Verification", score=10.0, max_score=10.0, explanation="Verified enterprise credentials"))
        elif v_status == "PENDING":
            verif_score = 5.0
            warnings.append("Buyer verification is under review")
            factors.append(BuyerMatchFactor(factor_name="Buyer Verification", score=5.0, max_score=10.0, explanation="Verification pending approval", is_positive=False))
        else:
            verif_score = 2.0
            warnings.append("Unverified buyer account — exercise escrow caution")
            factors.append(BuyerMatchFactor(factor_name="Buyer Verification", score=2.0, max_score=10.0, explanation="Unverified buyer account", is_positive=False))

        # 6. Payment Reliability (5 pts)
        reliability = buyer.payment_reliability_score or 90.0
        rel_score = round((reliability / 100.0) * 5.0, 1)
        if reliability >= 95.0:
            reasons.append(f"Exceptional payment reliability score ({reliability:.0f}%)")
        factors.append(BuyerMatchFactor(factor_name="Payment Reliability", score=rel_score, max_score=5.0, explanation=f"{reliability:.0f}% on-time settlement record"))

        # 7. Location / Logistics Radius (5 pts)
        radius = buyer.procurement_radius_km or 100.0
        loc_score = 5.0
        if radius >= 120.0 or "nashik" in buyer.location.lower() or "maharashtra" in buyer.location.lower():
            reasons.append(f"Operates direct collection within {radius:.0f} km radius")
            factors.append(BuyerMatchFactor(factor_name="Logistics Reach", score=5.0, max_score=5.0, explanation=f"Collection network covers {farmer_location}"))
        else:
            loc_score = 3.0
            warnings.append(f"Transit distance ({radius:.0f} km) may require coordinated logistics")
            factors.append(BuyerMatchFactor(factor_name="Logistics Reach", score=3.0, max_score=5.0, explanation=f"Longer haul pickup ({radius:.0f} km)", is_positive=False))

        # Total Composite Match Score (0 to 100)
        total_score = int(round(crop_score + qty_score + price_score + quality_score + verif_score + rel_score + loc_score))
        total_score = max(0, min(100, total_score))

        if total_score >= 85:
            match_level = "Excellent Match"
        elif total_score >= 70:
            match_level = "Strong Match"
        elif total_score >= 50:
            match_level = "Moderate Match"
        else:
            match_level = "Partial Match"

        # Direct vs Mandi Comparison
        comparison = self.calculate_direct_vs_mandi_comparison(
            crop_name=crop_name,
            quantity_qtl=quantity_qtl,
            buyer_name=buyer.name,
            buyer_indicative_price=indicative_price,
            mandi_benchmark_price=mandi_benchmark,
        )

        return BuyerMatchResult(
            buyer_id=buyer.id,
            buyer_name=buyer.name,
            organization=buyer.organization,
            location=buyer.location,
            phone=buyer.phone,
            email=buyer.email,
            verified=buyer.verified or (v_status == "VERIFIED"),
            verification_status=v_status,
            rating=buyer.rating or 4.5,
            business_type=buyer.business_type or "Enterprise Buyer",
            indicative_price_per_kg=indicative_price,
            match_score=total_score,
            match_level=match_level,
            reasons=reasons,
            warnings=warnings,
            comparison=comparison,
            factors=factors,
        )

    def match_buyers_for_lot(
        self,
        db: Session,
        crop_name: str = "Tomato",
        quantity_qtl: float = 20.0,
        quality_grade: str = "Grade A",
        farmer_location: str = "Nashik, Maharashtra",
        verified_only: bool = False,
    ) -> BuyerMatchingResponse:
        mandi_benchmark = self.get_mandi_benchmark_price(db, crop_name)
        
        query = db.query(Buyer)
        if verified_only:
            query = query.filter((Buyer.verified == True) | (Buyer.verification_status == "VERIFIED"))
        
        all_buyers = query.all()
        
        results: List[BuyerMatchResult] = []
        for b in all_buyers:
            res = self.evaluate_buyer_match(
                buyer=b,
                crop_name=crop_name,
                quantity_qtl=quantity_qtl,
                quality_grade=quality_grade,
                farmer_location=farmer_location,
                mandi_benchmark=mandi_benchmark,
            )
            results.append(res)

        # Sort strictly by Match Score (descending), then indicative price
        results.sort(key=lambda x: (x.match_score, x.indicative_price_per_kg), reverse=True)

        top_buyer = results[0].buyer_name if results else None

        return BuyerMatchingResponse(
            crop_name=crop_name,
            quantity_qtl=quantity_qtl,
            quality_grade=quality_grade,
            matched_buyers_count=len(results),
            top_matched_buyer=top_buyer,
            mandi_benchmark_price_per_kg=mandi_benchmark,
            buyers=results,
        )

    def get_nearby_demand_for_lot(
        self,
        db: Session,
        lot: Lot,
        max_radius_km: float = 25.0
    ) -> Dict[str, Any]:
        """
        Geospatial/Regional matching: finds FPOs and Buyers within ~25 km of the farmer's lot.
        Uses real coordinates if available, or district proximity.
        """
        farmer = db.query(Farmer).filter(Farmer.id == lot.farmer_id).first()
        farmer_coords = None
        if farmer and farmer.latitude and farmer.longitude:
            farmer_coords = (farmer.latitude, farmer.longitude)
        else:
            farmer_coords = get_coords_from_location(lot.location) or (
                get_coords_from_location(farmer.district) if farmer else (19.9975, 73.7898)
            )

        all_buyers = db.query(Buyer).all()
        matched_entries = []
        buyers_count_25km = 0
        fpos_count_25km = 0

        for b in all_buyers:
            is_fpo = "fpo" in (b.business_type or "").lower() or "fpc" in (b.business_type or "").lower() or "fpo" in (b.organization or "").lower()
            b_coords = get_coords_from_location(b.location)
            
            if farmer_coords and b_coords:
                distance = haversine_distance(farmer_coords[0], farmer_coords[1], b_coords[0], b_coords[1])
                is_exact = True
            else:
                # District fallback
                if farmer and farmer.district and farmer.district.lower() in b.location.lower():
                    distance = 12.5
                else:
                    distance = 45.0
                is_exact = False

            # Check crop compatibility
            crop = lot.crop
            crop_name = crop.crop_name if crop else ""
            pref_crops = b.preferred_crops or []
            crop_match = not pref_crops or any(crop_name.lower() in str(c).lower() for c in pref_crops)

            # Within radius or priority match
            if distance <= max_radius_km or (distance <= 40.0 and crop_match):
                if distance <= max_radius_km:
                    if is_fpo:
                        fpos_count_25km += 1
                    else:
                        buyers_count_25km += 1

                matched_entries.append({
                    "id": b.id,
                    "name": b.name,
                    "organization": b.organization or b.name,
                    "business_type": b.business_type or ("FPO / Producer Company" if is_fpo else "Institutional Buyer"),
                    "is_fpo": is_fpo,
                    "location": b.location,
                    "phone": b.phone,
                    "distance_km": distance,
                    "is_exact_distance": is_exact,
                    "interested_crops": pref_crops,
                    "min_quantity_qtl": b.min_quantity_qtl or 1.0,
                    "max_quantity_qtl": b.max_quantity_qtl or 500.0,
                    "indicative_price_per_kg": b.indicative_price_per_kg or lot.asking_price,
                    "verification_status": b.verification_status or ("VERIFIED" if b.verified else "UNVERIFIED"),
                    "rating": b.rating or 4.5,
                })

        # Sort by distance
        matched_entries.sort(key=lambda x: x["distance_km"])

        return {
            "lot_id": lot.id,
            "crop_name": lot.crop.crop_name if lot.crop else "Produce",
            "quantity_kg": lot.quantity,
            "asking_price": lot.asking_price,
            "location": lot.location,
            "radius_km": max_radius_km,
            "buyers_within_25km": buyers_count_25km,
            "fpos_within_25km": fpos_count_25km,
            "total_matches": len(matched_entries),
            "nearby_demand": matched_entries,
        }


buyer_matching_service = BuyerMatchingService()

