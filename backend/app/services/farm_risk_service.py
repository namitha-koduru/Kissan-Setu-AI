"""
Farm Risk Service for KissanSetuAI.
Evaluates multi-source agricultural hazards:
- Weather Risk (Rain, Heat/Cold Stress, Wind Drift)
- Soil Health Risk (Extreme pH, Nutrient Deficiencies)
- Crop Stage Vulnerability (Flowering drop, fruit cracking, rot)
- Harvest Timing Risk (Wet weather during maturity)
"""

from typing import List, Optional
from app.database.models import SoilProfile, Crop
from app.schemas.farm_intelligence import FarmRiskItem, FarmRiskSummary, WeatherSignals
from app.services.crop_knowledge import get_crop_knowledge
from app.services.soil_service import soil_service


class FarmRiskService:
    @classmethod
    def evaluate_farm_risks(
        cls,
        crops: List[Crop],
        soil: Optional[SoilProfile],
        weather: WeatherSignals
    ) -> FarmRiskSummary:
        risks: List[FarmRiskItem] = []

        # 1. Weather Risks
        if weather.rain_risk == "high":
            risks.append(
                FarmRiskItem(
                    type="weather",
                    severity="high",
                    title="Heavy Rainfall Risk (Next 48-72h)",
                    reason=f"Forecast rain probability peaks at {weather.rain_probability}%. Waterlogging and fungal spore dissemination risk is elevated.",
                    action="Inspect perimeter trench drainage and postpone foliar chemical sprays."
                )
            )
        elif weather.rain_risk == "medium":
            risks.append(
                FarmRiskItem(
                    type="weather",
                    severity="medium",
                    title="Moderate Rainfall Alert",
                    reason=f"Rain probability is {weather.rain_probability}%. Light to moderate showers expected.",
                    action="Avoid over-irrigation today and monitor soil moisture."
                )
            )

        if weather.spraying_risk == "avoid":
            risks.append(
                FarmRiskItem(
                    type="weather",
                    severity="high",
                    title="Spraying Wash-off & Drift Hazard",
                    reason="Upcoming precipitation or gusty winds make pesticide/foliar fertilizer applications ineffective and prone to run-off.",
                    action="Halt chemical spray operations until dry, calm canopy conditions return."
                )
            )

        if weather.temperature_stress == "heat_stress":
            risks.append(
                FarmRiskItem(
                    type="weather",
                    severity="medium",
                    title="High Daytime Temperature / Heat Stress",
                    reason="Elevated daytime temperatures increase evapotranspiration and risk blossom drop.",
                    action="Maintain regular morning drip irrigation and consider straw mulching."
                )
            )

        # 2. Soil Risks
        if soil:
            ph_info = soil_service.classify_ph(soil.ph)
            if ph_info["status"] in ["strongly_acidic", "alkaline"]:
                risks.append(
                    FarmRiskItem(
                        type="soil",
                        severity="medium",
                        title=f"Soil pH Limitation ({ph_info['label']})",
                        reason=f"Recorded pH is {soil.ph}. This may impede micronutrient absorption and root development.",
                        action="Incorporate organic compost or appropriate soil amendments (lime for acidic, gypsum for alkaline)."
                    )
                )

            n_status = soil_service.classify_nitrogen(soil.nitrogen)
            if n_status == "low":
                risks.append(
                    FarmRiskItem(
                        type="soil",
                        severity="medium",
                        title="Low Soil Nitrogen Reserve",
                        reason="Available soil nitrogen is below 280 kg/ha baseline, which can slow vegetative growth and leaf chlorophyll development.",
                        action="Apply split doses of nitrogenous fertilizers (e.g. neem-coated urea or vermicompost)."
                    )
                )

            p_status = soil_service.classify_phosphorus(soil.phosphorus)
            if p_status == "low":
                risks.append(
                    FarmRiskItem(
                        type="soil",
                        severity="low",
                        title="Low Phosphorus Reserve",
                        reason="Available soil phosphorus is low, which can impact root elongation and initial flowering.",
                        action="Supplement with Single Super Phosphate (SSP) or mycorrhiza."
                    )
                )
        else:
            risks.append(
                FarmRiskItem(
                    type="soil",
                    severity="low",
                    title="Soil Health Data Incomplete",
                    reason="No soil test has been recorded for your farm yet.",
                    action="Add your soil type and pH test in the Farm Profile to enable precise soil risk alerts."
                )
            )

        # 3. Active Crop & Growth Stage Specific Risks
        for crop in crops:
            stage_str = (crop.growth_stage or "").lower()
            crop_data = get_crop_knowledge(crop.crop_name)
            is_mature = any(w in stage_str for w in ["near maturity", "ready", "harvest", "maturity", "ripening", "neck fall"])
            is_flowering = any(w in stage_str for w in ["flower", "bloom", "setting", "fruit set"])

            # Rain risk during harvest maturity
            if is_mature and weather.rain_risk in ["medium", "high"]:
                risks.append(
                    FarmRiskItem(
                        type="harvest",
                        severity="high",
                        title=f"{crop.crop_name}: Harvest-Ready Moisture Risk",
                        reason=f"{crop.crop_name} is in '{crop.growth_stage}'. Heavy precipitation can cause skin cracking, rot, or post-harvest storage losses.",
                        action=f"Plan priority harvesting for mature {crop.crop_name} lots before the rain window."
                    )
                )

            # Rain risk during flowering
            if is_flowering and weather.rain_risk in ["high"]:
                risks.append(
                    FarmRiskItem(
                        type="crop_health",
                        severity="medium",
                        title=f"{crop.crop_name}: Flower Drop & Pollination Risk",
                        reason=f"{crop.crop_name} is in flowering/fruit setting. Heavy rains may cause flower abscission and poor fruit set.",
                        action="Ensure row drainage and inspect for early fungal spots once foliage dries."
                    )
                )

        # Calculate overall risk level & score
        high_count = sum(1 for r in risks if r.severity == "high")
        med_count = sum(1 for r in risks if r.severity == "medium")
        
        calculated_score = min(95, 15 + (high_count * 25) + (med_count * 12))
        
        if high_count >= 1 or calculated_score >= 60:
            overall = "high"
        elif med_count >= 1 or calculated_score >= 35:
            overall = "medium"
        else:
            overall = "low"

        return FarmRiskSummary(
            overall_risk=overall,
            risk_score=calculated_score,
            risks=risks
        )


farm_risk_service = FarmRiskService()
