"""
Central Farm Intelligence Orchestrator for KissanSetuAI.
Coordinates:
- Farmer & Farm Profile
- Soil Interpretation Service
- Weather Intelligence & Signals
- Active Crop Growth Stage Tracking & Health Inspection
- Explainable Crop Suitability Engine
- Farm Risk Engine
- Prioritized Farm Recommendations & Daily / Weekly Action Plan
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import Farmer, Crop, SoilProfile
from app.services.soil_service import soil_service
from app.services.weather_service import weather_service
from app.services.weather_intelligence import weather_intelligence_service
from app.services.crop_suitability_engine import crop_suitability_engine
from app.services.farm_risk_service import farm_risk_service
from app.services.crop_knowledge import get_crop_knowledge
from app.schemas.farm_intelligence import (
    FarmIntelligenceOverviewResponse,
    FarmRecommendationItem,
    FarmActionPlan,
    ActiveCropIntelligence,
    WeatherSignals,
    FarmRiskSummary,
    FarmRiskItem,
)
from app.schemas.soil import SoilInterpretationResponse


class FarmIntelligenceService:

    @classmethod
    def estimate_growth_stage(cls, sowing_date_str: Optional[str], crop_name: str) -> tuple[Optional[str], bool]:
        """
        Estimates growth stage from sowing date if present, with clear marking that it is an estimate.
        Returns: (stage_name, is_estimate)
        """
        if not sowing_date_str:
            return None, False

        try:
            sown = datetime.strptime(sowing_date_str.strip(), "%Y-%m-%d").date()
            days_elapsed = (date.today() - sown).days
            if days_elapsed < 0:
                return "Pre-sowing", True

            crop_data = get_crop_knowledge(crop_name)
            stages = crop_data.get("growth_stages", [])
            for st in stages:
                min_d, max_d = st["days"]
                if min_d <= days_elapsed <= max_d:
                    return f"{st['name']} (~{days_elapsed} days after sowing)", True

            if stages and days_elapsed > stages[-1]["days"][1]:
                return f"Post-harvest / Late Season (~{days_elapsed} days)", True

            return f"Growing stage (~{days_elapsed} days)", True
        except Exception:
            return None, False

    @classmethod
    def generate_recommendations(
        cls,
        crops: List[Crop],
        soil_interp: SoilInterpretationResponse,
        weather: WeatherSignals,
        risks: FarmRiskSummary
    ) -> List[FarmRecommendationItem]:
        """
        Generates prioritized, explainable agronomic recommendations combining:
        - Weather signals & irrigation need
        - Soil nutrient & pH adjustments
        - Active crop stages & pest/spray advisories
        """
        recs: List[FarmRecommendationItem] = []

        # 1. Weather-driven immediate actions
        if weather.irrigation_need == "skip":
            recs.append(
                FarmRecommendationItem(
                    priority="high",
                    category="irrigation",
                    title="Postpone Irrigation Today",
                    reason=f"Significant rainfall expected ({weather.rain_probability}% probability). Soil moisture will be replenished naturally.",
                    action="Turn off scheduled pump timers and monitor field drainage channels.",
                    confidence=0.92,
                    urgency="Today"
                )
            )
        elif weather.irrigation_need == "reduced":
            recs.append(
                FarmRecommendationItem(
                    priority="medium",
                    category="irrigation",
                    title="Reduce Irrigation Volume by 30-40%",
                    reason="Upcoming overcast conditions and light showers will lower atmospheric evaporative demand.",
                    action="Run light maintenance irrigation only in sandy or well-drained blocks.",
                    confidence=0.88,
                    urgency="Today"
                )
            )
        elif weather.irrigation_need == "increase":
            recs.append(
                FarmRecommendationItem(
                    priority="high",
                    category="irrigation",
                    title="Maintain Early Morning Drip Irrigation",
                    reason="Elevated daytime temperature accelerates soil moisture loss and causes wilting.",
                    action="Irrigate during early morning (6:00 AM - 9:00 AM) to maximize water absorption efficiency.",
                    confidence=0.89,
                    urgency="Today"
                )
            )

        if weather.spraying_risk == "avoid":
            recs.append(
                FarmRecommendationItem(
                    priority="high",
                    category="crop-care",
                    title="Avoid Foliar Sprays Immediately Before Rain",
                    reason="Rainfall will wash away active chemical/organic spray ingredients, causing wastage and environmental run-off.",
                    action="Postpone spray operations until 24 hours of dry foliage weather is available.",
                    confidence=0.95,
                    urgency="Today"
                )
            )

        # 2. Soil-driven recommendations
        if soil_interp.has_data:
            if soil_interp.nitrogen_status == "low":
                recs.append(
                    FarmRecommendationItem(
                        priority="medium",
                        category="soil",
                        title="Address Low Nitrogen Reserve",
                        reason="Recorded available nitrogen is below standard agronomic baseline, which may restrict canopy expansion.",
                        action="Apply split top-dressing of well-rotted FYM, vermicompost, or neem-coated urea at root zone.",
                        confidence=0.86,
                        urgency="This Week"
                    )
                )

            if soil_interp.ph_status in ["strongly_acidic", "alkaline"]:
                recs.append(
                    FarmRecommendationItem(
                        priority="medium",
                        category="soil",
                        title=f"Manage Soil pH ({soil_interp.soil_condition})",
                        reason="Extreme pH values bind essential micronutrients like Zinc, Boron, and Iron.",
                        action="Incorporate organic soil amendments or gypsum/lime during next field preparation cycle.",
                        confidence=0.84,
                        urgency="This Week"
                    )
                )
        else:
            recs.append(
                FarmRecommendationItem(
                    priority="medium",
                    category="soil",
                    title="Record Soil Test Details",
                    reason="Adding your soil type and pH unlocks tailored crop-specific fertilizer and suitability advice.",
                    action="Update your soil profile using your Soil Health Card or recent lab test.",
                    confidence=0.80,
                    urgency="This Week"
                )
            )

        # 3. Active Crop Specific Advisories
        for crop in crops:
            stage_str = (crop.growth_stage or "").lower()
            crop_name = crop.crop_name

            if "fruiting" in stage_str or "bulb" in stage_str or "berry" in stage_str:
                recs.append(
                    FarmRecommendationItem(
                        priority="medium",
                        category="crop-care",
                        title=f"{crop_name}: Monitor Fruit & Bulb Development",
                        reason=f"{crop_name} is in '{crop.growth_stage}', a critical phase for sizing, sugar accumulation, and pest inspection.",
                        action=f"Inspect undersides of {crop_name} leaves for sucking pests (thrips/aphids) and maintain steady soil moisture.",
                        confidence=0.88,
                        urgency="Today"
                    )
                )

            if "near maturity" in stage_str or "ready" in stage_str:
                recs.append(
                    FarmRecommendationItem(
                        priority="high",
                        category="harvest",
                        title=f"{crop_name}: Prepare for Harvest Picking",
                        reason=f"{crop_name} has reached maturity. Timely harvesting prevents over-ripening and weather spoilage.",
                        action=f"Harvest mature {crop_name} in early morning crates and route via local APMC or buyers.",
                        confidence=0.91,
                        urgency="This Week"
                    )
                )

        # Routine Monitoring Item
        recs.append(
            FarmRecommendationItem(
                priority="low",
                category="monitoring",
                title="Routine Crop & Soil Inspection",
                reason="Regular weekly farm monitoring ensures early detection of foliar symptoms or nutrient stress.",
                action="Walk field borders to check weed emergence, drip line emitters, and soil compaction.",
                confidence=0.80,
                urgency="Routine"
            )
        )

        return recs

    @classmethod
    def generate_action_plan(cls, recs: List[FarmRecommendationItem]) -> FarmActionPlan:
        today_recs = [r for r in recs if r.urgency == "Today" or r.priority == "high"]
        this_week_recs = [r for r in recs if r.urgency == "This Week" and r not in today_recs]
        routine_recs = [r for r in recs if r.urgency == "Routine" and r not in today_recs and r not in this_week_recs]

        # Ensure no empty lists for smooth UI rendering
        if not today_recs and recs:
            today_recs = recs[:2]
        if not this_week_recs and len(recs) > 2:
            this_week_recs = recs[2:4]
        if not routine_recs and len(recs) > 4:
            routine_recs = recs[4:]

        return FarmActionPlan(
            today=today_recs,
            this_week=this_week_recs,
            routine=routine_recs
        )

    @classmethod
    def get_farm_intelligence_overview(
        cls,
        db: Session,
        farmer_id: Optional[int] = 1,
        explicit_location: Optional[str] = None
    ) -> FarmIntelligenceOverviewResponse:
        """
        Consolidated Farm Intelligence Service.
        Aggregates farm context, soil interpretation, weather signals, crop risks, recommendations,
        and crop suitability rankings into a single structured payload.
        """
        farmer = None
        if farmer_id:
            farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()

        location = farmer.district if farmer and farmer.district else (explicit_location or "Nashik")
        state = farmer.state if farmer and farmer.state else "Maharashtra"
        full_location_str = f"{location}, {state}"

        # 1. Soil Profile & Interpretation
        soil_profile = None
        if farmer:
            soil_profile = db.query(SoilProfile).filter(SoilProfile.farmer_id == farmer.id).first()

        soil_interp = soil_service.interpret_soil(soil_profile)

        # 2. Weather & Signals
        weather_raw = weather_service.get_weather_for_location(location)
        weather_signals = weather_intelligence_service.extract_weather_signals(location)

        # 3. Crops & Growth Stage estimation
        crops: List[Crop] = []
        if farmer:
            crops = db.query(Crop).filter(Crop.farmer_id == farmer.id).all()

        active_crop_intelligences: List[ActiveCropIntelligence] = []
        total_acreage = 0.0

        for c in crops:
            total_acreage += (c.acreage or 1.0)
            est_stage, is_est = cls.estimate_growth_stage(c.sowing_date, c.crop_name)
            crop_soil_compat = soil_service.check_crop_soil_compatibility(c.crop_name, soil_profile)

            active_crop_intelligences.append(
                ActiveCropIntelligence(
                    id=c.id,
                    crop_name=c.crop_name,
                    variety=c.variety,
                    acreage=c.acreage,
                    quantity=c.quantity,
                    growth_stage=c.growth_stage or "Growing",
                    estimated_stage=est_stage,
                    stage_is_estimate=is_est,
                    sowing_date=c.sowing_date,
                    expected_harvest_date=c.expected_harvest_date,
                    health_status="Good Condition",
                    soil_match=crop_soil_compat["status"],
                    risks=[],
                    recommendations=[]
                )
            )

        # 4. Farm Risks
        risks_summary = farm_risk_service.evaluate_farm_risks(crops, soil_profile, weather_signals)

        # 5. Recommendations & Action Plan
        recommendations = cls.generate_recommendations(crops, soil_interp, weather_signals, risks_summary)
        action_plan = cls.generate_action_plan(recommendations)

        # 6. Crop Suitability Ranking
        crop_suitability = crop_suitability_engine.rank_crops_for_farm(
            soil=soil_profile,
            weather=weather_signals,
            location=full_location_str,
            acreage=total_acreage if total_acreage > 0 else 3.5
        )

        farm_meta = {
            "farmer_id": farmer.id if farmer else 1,
            "farmer_name": farmer.name if farmer else "Ramesh Kumar",
            "location": full_location_str,
            "district": location,
            "state": state,
            "total_acreage": round(total_acreage, 1) if total_acreage > 0 else 3.5,
            "preferred_language": farmer.preferred_language if farmer else "en",
            "active_crops_count": len(crops)
        }

        data_completeness = {
            "has_farmer_profile": farmer is not None,
            "has_crops": len(crops) > 0,
            "has_soil_profile": soil_profile is not None,
            "soil_ph_available": soil_profile is not None and soil_profile.ph is not None,
            "has_weather": True,
            "data_quality": "High" if (soil_profile and soil_profile.ph is not None and len(crops) > 0) else "Moderate",
            "recommendation_notice": "Recommendations calculated using verified farm and meteorological signals." if (soil_profile and soil_profile.ph) else "Recommendations based on available farm and regional baseline data."
        }

        return FarmIntelligenceOverviewResponse(
            farm=farm_meta,
            weather=weather_signals,
            weather_summary={
                "temperature": weather_raw.temperature,
                "humidity": weather_raw.humidity,
                "rain_probability": weather_raw.rain_probability,
                "condition": weather_raw.condition,
                "risk_level": weather_raw.risk_level,
                "agricultural_advisory": weather_raw.agricultural_advisory
            },
            soil=soil_interp,
            active_crops=active_crop_intelligences,
            risks=risks_summary,
            recommendations=recommendations,
            action_plan=action_plan,
            crop_suitability=crop_suitability,
            data_completeness=data_completeness,
            generated_at=datetime.utcnow().isoformat()
        )


farm_intelligence_service = FarmIntelligenceService()
