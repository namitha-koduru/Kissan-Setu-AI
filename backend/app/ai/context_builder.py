"""
Context Builder for KissanSetuAI Farmer Assistant.
Aggregates Farmer Profile, Crops, Soil Profile, Weather Intelligence Signals, Farm Risks,
Crop Suitability, and Market Intelligence (Prices, Trends, Forecasts, Best Market Net Realization, Buyer Demand)
into a concise, structured context block for the LLM.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.database.models import Farmer, Crop, Market, MarketPrice, SoilProfile
from app.services.weather_service import weather_service
from app.services.weather_intelligence import weather_intelligence_service
from app.services.soil_service import soil_service
from app.services.farm_risk_service import farm_risk_service
from app.services.crop_suitability_engine import crop_suitability_engine
from app.services.market_intelligence_service import market_intelligence_service


class FarmContextBuilder:
    @classmethod
    def build_context(cls, db: Session, farmer_id: Optional[int] = None, explicit_location: Optional[str] = None) -> str:
        parts = []

        farmer = None
        if farmer_id:
            farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()

        location_district = "Nashik"
        location_state = "Maharashtra"
        primary_crop_name = "Tomato"

        if farmer:
            location_district = farmer.district or "Nashik"
            location_state = farmer.state or "Maharashtra"
            parts.append(
                f"- Farmer Profile: {farmer.name}, {farmer.village + ', ' if farmer.village else ''}{location_district}, {location_state}"
            )
            parts.append(f"- Preferred Language: {farmer.preferred_language or 'en'}")

            # 1. Active Crops in field
            crops = db.query(Crop).filter(Crop.farmer_id == farmer.id).all()
            if crops:
                crop_lines = []
                for c in crops:
                    crop_lines.append(
                        f"  * {c.crop_name} ({c.variety or 'Standard'}): {c.acreage or 1.0} acres, "
                        f"Quantity ~{c.quantity} kg, Growth Stage: '{c.growth_stage}', "
                        f"Soil: '{c.soil_type or 'Loam'}', Sowing Date: {c.sowing_date or 'Not recorded'}"
                    )
                parts.append("- Active Farmer Crops:\n" + "\n".join(crop_lines))
                primary_crop_name = crops[0].crop_name
            else:
                crops = []

            # 2. Soil Intelligence Profile
            soil = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer.id).first()
            soil_interp = soil_service.interpret_soil(soil)
            if soil_interp.has_data:
                parts.append(
                    f"- Farm Soil Status: Type={soil.soil_type or 'Black'}, pH={soil.ph or 'Unknown'} ({soil_interp.ph_status}), "
                    f"Nitrogen={soil_interp.nitrogen_status.upper()} ({soil.nitrogen if soil.nitrogen is not None else 'N/A'} kg/ha), "
                    f"Phosphorus={soil_interp.phosphorus_status.upper()}, Potassium={soil_interp.potassium_status.upper()}, "
                    f"Organic Carbon={soil.organic_carbon if soil.organic_carbon is not None else 'N/A'}% ({soil_interp.organic_carbon_status.upper()})"
                )
                if soil_interp.observations:
                    parts.append(f"- Soil Observations: {'; '.join(soil_interp.observations[:3])}")
            else:
                parts.append("- Farm Soil Status: No verified soil test recorded. Recommendations use regional baseline.")
        elif explicit_location:
            location_district = explicit_location
            parts.append(f"- Location: {explicit_location}")
            crops = []
            soil = None
            soil_interp = soil_service.interpret_soil(None)

        # 3. Weather Intelligence & Signals
        try:
            weather_raw = weather_service.get_weather_for_location(location_district)
            weather_signals = weather_intelligence_service.extract_weather_signals(location_district)
            parts.append(
                f"- Live Weather ({location_district}): {weather_raw.temperature}°C, {weather_raw.condition}, "
                f"Rain Probability: {weather_raw.rain_probability}%, Humidity: {weather_raw.humidity}%"
            )
            parts.append(
                f"- Agricultural Weather Signals: Rain Risk={weather_signals.rain_risk.upper()}, "
                f"Spraying Advice={weather_signals.spraying_risk.upper()}, "
                f"Irrigation Action={weather_signals.irrigation_need.upper()}, "
                f"Harvest Weather Risk={weather_signals.harvest_weather_risk.upper()}"
            )
            if weather_signals.advisories:
                parts.append(f"- Weather Advisories: {'; '.join(weather_signals.advisories[:2])}")
        except Exception:
            weather_signals = weather_intelligence_service.extract_weather_signals(location_district)
            parts.append(f"- Weather: Normal seasonal conditions in {location_district}.")

        # 4. Farm Risks
        try:
            risks_summary = farm_risk_service.evaluate_farm_risks(crops, soil, weather_signals)
            parts.append(f"- Farm Risk Level: {risks_summary.overall_risk.upper()} (Risk Score: {risks_summary.risk_score}/100)")
            if risks_summary.risks:
                risk_titles = [f"{r.title} ({r.severity.upper()} severity: {r.action})" for r in risks_summary.risks[:3]]
                parts.append(f"- Active Farm Hazards: {'; '.join(risk_titles)}")
        except Exception:
            pass

        # 5. Crop Suitability Snapshot (Top 3)
        try:
            suitability_list = crop_suitability_engine.rank_crops_for_farm(
                soil=soil,
                weather=weather_signals,
                location=f"{location_district}, {location_state}"
            )
            top_crops = [f"{item.crop} ({item.suitability_score}% suitability - {item.compatibility_level})" for item in suitability_list[:3]]
            parts.append(f"- Regional Crop Suitability Ranking: {', '.join(top_crops)}")
        except Exception:
            pass

        # 6. Structured Market Intelligence & Selling Decision (Phase 5)
        try:
            market_overview = market_intelligence_service.get_market_intelligence_overview(
                db=db,
                crop_name=primary_crop_name,
                farmer_id=farmer.id if farmer else 1
            )
            parts.append(
                f"- Market Intelligence ({primary_crop_name}): Current Price = ₹{market_overview.current_price.current_modal_price}/Qtl (₹{market_overview.current_price.current_price_per_kg}/kg), "
                f"7D Trend = {market_overview.trend.get('direction', 'stable').upper()} ({market_overview.trend.get('change_7d_percent', 0)}%), "
                f"3-Day Forecast = ₹{market_overview.forecast.expected_price_qtl}/Qtl (Range: ₹{market_overview.forecast.expected_range_qtl[0]}–₹{market_overview.forecast.expected_range_qtl[1]})"
            )
            parts.append(
                f"- AI Selling Signal: {market_overview.decision.action} ({market_overview.decision.action_label}) - {market_overview.decision.headline}"
            )
            parts.append(
                f"- Recommended Best Market: {market_overview.best_market.market_name} (Estimated Net Realization: ₹{int(market_overview.best_market.estimated_net_realization)} / ₹{market_overview.best_market.net_price_per_kg}/kg in-hand after freight)"
            )
            if market_overview.best_buyer:
                parts.append(
                    f"- Best Institutional Buyer Opportunity: {market_overview.best_buyer.name} (Indicative Offer: ₹{market_overview.best_buyer.indicative_offer_qtl}/Qtl, {market_overview.best_buyer.verification_status})"
                )
        except Exception:
            pass

        # 7. Phase 6: Smart Buyer Matching & Direct vs Mandi Advantage
        try:
            from app.services.buyer_matching_service import buyer_matching_service
            matching_resp = buyer_matching_service.match_buyers_for_lot(
                db=db,
                crop_name=primary_crop_name,
                quantity_qtl=20.0,
                farmer_location=location_district,
            )
            if matching_resp.buyers:
                top_b = matching_resp.buyers[0]
                adv_text = ""
                if top_b.comparison:
                    adv_text = f", Net Advantage: +₹{top_b.comparison.net_advantage_total:,.0f} (+₹{top_b.comparison.net_advantage_per_kg:.2f}/kg vs mandi)"
                parts.append(
                    f"- Top Matched Buyer (Phase 6): {top_b.buyer_name} (Match Score: {top_b.match_score}/100, {top_b.verification_status}, Indicative Rate: ₹{top_b.indicative_price_per_kg:.2f}/kg{adv_text})"
                )
                if top_b.reasons:
                    parts.append(f"- Why This Buyer: {'; '.join(top_b.reasons[:2])}")
        except Exception:
            pass

        # 8. Phase 6: Active Negotiation & Transaction Status
        try:
            if farmer:
                from app.database.models import Lot, Offer, Transaction
                active_lots = db.query(Lot).filter(Lot.farmer_id == farmer.id).all()
                lot_ids = [l.id for l in active_lots]
                if lot_ids:
                    pending_offers = db.query(Offer).filter(Offer.lot_id.in_(lot_ids), Offer.status.in_(["Pending", "Countered"])).all()
                    if pending_offers:
                        offer_summaries = [f"Offer #{o.id}: ₹{o.offered_price:.2f}/kg (Status: {o.status})" for o in pending_offers[:2]]
                        parts.append(f"- Active Marketplace Offers Awaiting Response: {'; '.join(offer_summaries)}")

                active_txs = db.query(Transaction).filter(Transaction.farmer_id == farmer.id).order_by(Transaction.created_at.desc()).limit(2).all()
                if active_txs:
                    tx_summaries = [f"Tx #{t.id}: ₹{t.total_amount:,.0f} (Status: {t.status}, Logistics: {t.logistics_status}, Payment: {t.payment_status})" for t in active_txs]
                    parts.append(f"- Active Digital Transactions: {'; '.join(tx_summaries)}")
        except Exception:
            pass

        return "\n".join(parts) if parts else "General Indian Agronomic Context."


context_builder = FarmContextBuilder()
