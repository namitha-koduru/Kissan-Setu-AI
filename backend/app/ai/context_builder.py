"""
Context Builder for KissanSetuAI Farmer Assistant.
Aggregates Farmer Profile, Crops, Soil Profile, Weather Intelligence Signals, Farm Risks,
Recommendations, and Mandi Intelligence into a concise, structured context block for the LLM.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.database.models import Farmer, Crop, Market, MarketPrice, SoilProfile
from app.services.weather_service import weather_service
from app.services.weather_intelligence import weather_intelligence_service
from app.services.soil_service import soil_service
from app.services.farm_risk_service import farm_risk_service
from app.services.crop_suitability_engine import crop_suitability_engine


class FarmContextBuilder:
    @classmethod
    def build_context(cls, db: Session, farmer_id: Optional[int] = None, explicit_location: Optional[str] = None) -> str:
        parts = []

        farmer = None
        if farmer_id:
            farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()

        location_district = "Nashik"
        location_state = "Maharashtra"

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

        # 6. Mandi Market Price Snapshot
        try:
            mandi_prices = (
                db.query(MarketPrice, Market)
                .join(Market, MarketPrice.market_id == Market.id)
                .filter(Market.district.ilike(f"%{location_district}%"))
                .limit(3)
                .all()
            )
            if mandi_prices:
                price_strs = [
                    f"{p.MarketPrice.crop_name} at {p.Market.name}: ₹{p.MarketPrice.price}/{p.MarketPrice.unit}"
                    for p in mandi_prices
                ]
                parts.append(f"- Nearby Mandi Benchmarks: {'; '.join(price_strs)}")
        except Exception:
            pass

        return "\n".join(parts) if parts else "General Indian Agronomic Context."


context_builder = FarmContextBuilder()
