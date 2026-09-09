"""
Recommendation Service for KissanSetuAI.
Connects Weather Intelligence, Crop Growth Stage & Harvest Timing, Crop Perishability/Storage Economics,
and Market Intelligence to generate actionable farmer decisions:
- SELL_NOW
- HOLD
- MONITOR
- COMPARE_MARKETS
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    MarketComparisonItem,
)
from app.services.weather_service import weather_service
from app.services.weather_intelligence import weather_intelligence_service
from app.services.market_intelligence_service import market_intelligence_service


class RecommendationService:
    """
    Multimodal Farm Decision Engine.
    Synthesizes:
    1. Crop type and agronomic category (Perishable, Storable tuber, Dry commercial)
    2. Growth / harvest stage & days remaining to harvest
    3. Live weather & precipitation / humidity risks
    4. Market prices, 7D/30D moving averages & price momentum
    5. Buyer demand levels & direct procurement premiums
    6. Transport freight, handling, and net in-hand realization
    """

    @classmethod
    def evaluate_recommendation(
        cls,
        req: RecommendationRequest,
        db: Optional[Session] = None
    ) -> RecommendationResponse:
        created_local_db = False
        if db is None:
            db = SessionLocal()
            created_local_db = True

        try:
            crop_name = req.crop_name.strip()
            qty_kg = max(1.0, req.quantity_kg)
            stage_str = (req.growth_stage or "").lower()
            location = req.location or "Nashik"

            # 1. Fetch Crop Agronomic & Market Meta
            meta = market_intelligence_service._get_crop_meta(crop_name)
            shelf_life = meta.get("shelf_life_days", 15)
            is_perishable = shelf_life <= 7
            is_dry_commercial = shelf_life >= 90
            is_tuber_storable = 15 < shelf_life < 90
            holding_cost_per_day = meta.get("holding_cost_per_qtl_day", 1.5)
            msp_benchmark = meta.get("msp_benchmark")

            # 2. Weather Signals
            weather = weather_service.get_weather_for_location(location)
            weather_signals = weather_intelligence_service.extract_weather_signals(location)
            rain_risk_high = weather_signals.rain_risk in ["medium", "high"] or (weather.rain_probability >= 40)

            # 3. Market Intelligence (Prices, Trends, Forecast, Comparisons)
            mandi_comparisons = market_intelligence_service.compare_markets(
                db=db,
                crop_name=crop_name,
                quantity_kg=qty_kg,
                farmer_location=location
            )
            best_market = mandi_comparisons[0] if mandi_comparisons else None

            price_history = market_intelligence_service.get_historical_prices(
                db=db,
                crop_name=crop_name,
                market_name=meta.get("primary_mandi"),
                days=14
            )
            curr_modal = price_history.current_modal_price
            curr_kg = price_history.current_price_per_kg
            trend_dir = price_history.trend_direction
            change_7d = price_history.change_7d_percent or 0.0

            # 4. Harvest Readiness & Days to Harvest Evaluation
            days_to_harvest: Optional[int] = None
            if req.expected_harvest_date:
                try:
                    target_d = datetime.strptime(req.expected_harvest_date.strip(), "%Y-%m-%d").date()
                    days_to_harvest = (target_d - date.today()).days
                except Exception:
                    pass

            is_mature = any(
                kw in stage_str
                for kw in [
                    "mature", "ready", "harvest", "ripening", "neck fall",
                    "picked", "boll opening", "80% red", "70-80% red", "ripe"
                ]
            )
            is_vegetative_or_early = any(
                kw in stage_str
                for kw in [
                    "vegetative", "seedling", "flowering", "budding", "early",
                    "tillering", "squaring", "tuber initiation"
                ]
            ) or (days_to_harvest is not None and days_to_harvest > 10)

            # Storage holding economics (3 days holding benefit)
            storage_cost_3d = round(3 * holding_cost_per_day, 1)
            forecast_expected = curr_modal * (1.03 if trend_dir in ["rising", "strongly_rising"] else (0.97 if trend_dir in ["falling", "strongly_falling"] else 1.005))
            potential_gain = round(forecast_expected - curr_modal, 1)
            net_holding_benefit = round(potential_gain - storage_cost_3d, 1)

            # 5. Core Decision Logic Synthesis
            reasons: List[str] = []
            decision: str = "MONITOR"
            confidence: int = 85
            harvest_window: str = "3–5 days"
            buyer_demand = best_market.buyer_demand if best_market else "High"

            # CASE A: Immature / Early vegetative / Flowering stage
            if is_vegetative_or_early and not is_mature:
                decision = "MONITOR"
                confidence = 88
                harvest_window = f"{days_to_harvest if days_to_harvest and days_to_harvest > 0 else '10–20'} days"
                reasons.append(f"{crop_name} is currently in '{req.growth_stage}' stage. Premature picking leads to severe weight and grade discounts.")
                reasons.append(f"Monitor vegetative growth and maintain {weather_signals.irrigation_need} irrigation schedule based on upcoming weather.")
                reasons.append(f"Current regional mandi baseline is ₹{curr_modal}/Qtl; allow crops to reach full maturity.")

            # CASE B: Perishable Produce (e.g. Tomato, Grapes)
            elif is_perishable:
                if rain_risk_high:
                    decision = "SELL_NOW"
                    confidence = 94
                    harvest_window = "Next 24–48 hours (Before rain)"
                    reasons.append(f"Imminent precipitation ({weather.rain_probability}% rain probability) presents severe cracking and fungal decay risk for perishable {crop_name}.")
                    reasons.append(f"Short shelf life ({shelf_life} days) prevents safe field holding in wet weather.")
                    reasons.append(f"{best_market.market_name if best_market else 'Recommended Mandi'} offers optimal net return (₹{best_market.net_price_per_kg if best_market else curr_kg}/kg) with fast transit.")
                elif trend_dir in ["falling", "strongly_falling"]:
                    decision = "SELL_NOW"
                    confidence = 90
                    harvest_window = "Next 1–2 days"
                    reasons.append(f"{crop_name} prices are declining ({change_7d}% over 7 days). Sell now to protect margins.")
                    reasons.append(f"High buyer demand in {best_market.market_name if best_market else 'nearby APMC'} supports rapid farmgate clearance.")
                elif len(mandi_comparisons) > 1 and (mandi_comparisons[0].net_price_per_kg - mandi_comparisons[-1].net_price_per_kg) >= 2.0:
                    decision = "COMPARE_MARKETS"
                    confidence = 86
                    harvest_window = "Next 2–3 days"
                    reasons.append(f"{best_market.market_name} provides ₹{best_market.net_price_per_kg}/kg net vs ₹{mandi_comparisons[-1].net_price_per_kg}/kg at distant alternatives.")
                    reasons.append("Compare direct buyer procurement tenders against local APMC auctions.")
                else:
                    decision = "SELL_NOW"
                    confidence = 88
                    harvest_window = "Next 2–4 days"
                    reasons.append(f"{crop_name} is ready for harvest with favorable market realization (₹{curr_kg}/kg).")
                    reasons.append("Prompt marketing prevents transit weight shrinkage.")

            # CASE C: Dry Commercial / Storable Produce (e.g. Cotton, Wheat, Soybean)
            elif is_dry_commercial:
                if msp_benchmark and curr_modal >= (msp_benchmark * 1.04) and trend_dir in ["falling", "strongly_falling"]:
                    decision = "SELL_NOW"
                    confidence = 90
                    harvest_window = "Next 3–5 days"
                    reasons.append(f"Current modal rate (₹{curr_modal}/Qtl) captures premium (+₹{int(curr_modal - msp_benchmark)}/Qtl above ₹{msp_benchmark} MSP).")
                    reasons.append("Softening regional price trend suggests locking in direct spinning mill contracts now.")
                elif trend_dir in ["rising", "strongly_rising"] and net_holding_benefit > 15:
                    decision = "HOLD"
                    confidence = 87
                    harvest_window = "Hold for 7–14 days"
                    reasons.append(f"{crop_name} has high dry godown storability ({shelf_life} days) with minimal holding cost (₹{storage_cost_3d}/Qtl for 3 days).")
                    reasons.append(f"Rising mill procurement momentum indicates expected net upside of +₹{int(net_holding_benefit)}/Qtl.")
                    reasons.append("Hold stock in moisture-controlled godown (<8% moisture) to bid for premium institutional tenders.")
                elif len(mandi_comparisons) > 1 and (mandi_comparisons[0].net_price_per_kg - mandi_comparisons[-1].net_price_per_kg) >= 1.5:
                    decision = "COMPARE_MARKETS"
                    confidence = 84
                    harvest_window = "Next 3–7 days"
                    reasons.append(f"{best_market.market_name} yields highest net return after transport deductions.")
                    reasons.append("Route cotton lots to specialized ginning and pressing yards rather than general vegetable mandis.")
                else:
                    decision = "HOLD" if trend_dir in ["rising", "stable"] else "SELL_NOW"
                    confidence = 82
                    harvest_window = "Next 5–7 days"
                    reasons.append(f"Balanced market conditions for {crop_name} across regional trading yards.")

            # CASE D: Tuber / Cold Storage Produce (e.g. Potato, Onion)
            elif is_tuber_storable:
                if curr_modal >= (price_history.avg_30d * 1.05) and trend_dir in ["falling", "strongly_falling"]:
                    decision = "SELL_NOW"
                    confidence = 89
                    harvest_window = "Next 2–4 days"
                    reasons.append(f"Current price is {round(change_7d, 1)}% favorable. Capture rate before neighboring harvest arrivals expand supply.")
                    reasons.append("Direct food processing buyers and cold chains are actively procuring at firm rates.")
                elif trend_dir in ["rising", "strongly_rising"] and net_holding_benefit > 20:
                    decision = "HOLD"
                    confidence = 85
                    harvest_window = "Hold for 7–12 days"
                    reasons.append(f"Cold storage holding ({shelf_life} days capacity) yields +₹{int(net_holding_benefit)}/Qtl net margin over refrigeration cost.")
                    reasons.append("Upward price trend in urban wholesale centers justifies holding graded lots.")
                else:
                    decision = "COMPARE_MARKETS"
                    confidence = 83
                    harvest_window = "Next 3–5 days"
                    reasons.append(f"{best_market.market_name if best_market else 'Regional Hub'} provides higher net return after freight deductions.")
                    reasons.append("Check cold chain aggregation partners and local APMC yard differentials.")

            # Fallback for standard crops
            else:
                if rain_risk_high and is_mature:
                    decision = "SELL_NOW"
                    confidence = 90
                    harvest_window = "Next 24–48 hours"
                    reasons.append(f"Upcoming rain ({weather.rain_probability}%) increases spoilage risk for mature lot.")
                elif trend_dir in ["rising", "strongly_rising"] and not is_mature:
                    decision = "HOLD"
                    confidence = 84
                    harvest_window = "5–10 days"
                    reasons.append(f"Favorable price momentum and crop sizing support holding stock.")
                else:
                    decision = "COMPARE_MARKETS"
                    confidence = 80
                    harvest_window = "Next 3–5 days"
                    reasons.append(f"Compare nearby mandis and direct buyer offers for {crop_name}.")

            # 6. Map Market Comparison Items
            schema_comparisons: List[MarketComparisonItem] = []
            for m in mandi_comparisons:
                schema_comparisons.append(
                    MarketComparisonItem(
                        market_id=m.market_id,
                        market_name=m.market_name,
                        mandi_price=m.modal_price_per_kg,
                        distance_km=m.distance_km,
                        transport_cost=m.estimated_transport_cost,
                        storage_cost=0.0,
                        handling_loss=round(m.estimated_market_charges + m.estimated_handling_cost, 0),
                        net_realization=m.net_price_per_kg,
                        demand=m.buyer_demand,
                        is_recommended=m.is_best_market
                    )
                )

            best_m_name = best_market.market_name if best_market else f"{location} APMC"
            best_net_kg = best_market.net_price_per_kg if best_market else curr_kg

            return RecommendationResponse(
                decision=decision,
                confidence_score=confidence,
                crop_name=crop_name,
                quantity_kg=qty_kg,
                growth_stage=req.growth_stage,
                harvest_window=harvest_window,
                weather_risk=weather.risk_level or weather_signals.rain_risk.capitalize(),
                buyer_demand=buyer_demand,
                best_market=best_m_name,
                expected_net_realization=best_net_kg,
                total_expected_revenue=round(best_net_kg * qty_kg, 0),
                reasons=reasons,
                market_comparisons=schema_comparisons,
                score_breakdown={
                    "net_realization_score": best_net_kg,
                    "weather_pressure": 90 if rain_risk_high else 20,
                    "readiness_score": 90 if is_mature else (30 if is_vegetative_or_early else 65),
                    "demand_weight": 95 if buyer_demand == "High" else 65,
                    "holding_benefit": net_holding_benefit,
                    "perishability_penalty": 85 if is_perishable else 20,
                },
            )
        finally:
            if created_local_db:
                db.close()

    @classmethod
    def generate_recommendation(
        cls,
        req: RecommendationRequest,
        db: Optional[Session] = None
    ) -> RecommendationResponse:
        return cls.evaluate_recommendation(req, db)


recommendation_service = RecommendationService()
