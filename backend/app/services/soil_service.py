"""
Soil Interpretation and Validation Service for KissanSetuAI.
Provides transparent agronomic soil classification:
- pH status classification (strongly acidic, moderately acidic, neutral, slightly alkaline, alkaline)
- Available N, P, K nutrient rating (low, medium, high) based on ICAR / Soil Health Card standard benchmarks
- Organic carbon status (%)
- Moisture status
- Crop-specific soil compatibility checks & transparent observations
"""

from typing import Optional, Dict, Any, List
from app.database.models import SoilProfile
from app.schemas.soil import SoilInterpretationResponse, SoilProfileResponse
from app.services.crop_knowledge import get_crop_knowledge


class SoilService:
    """
    Standard Indian Soil Health Card Benchmarks (kg/ha):
    - Nitrogen (N): Low < 280, Medium 280-560, High > 560 kg/ha
    - Phosphorus (P2O5): Low < 10, Medium 10-25, High > 25 kg/ha
    - Potassium (K2O): Low < 110, Medium 110-280, High > 280 kg/ha
    - Organic Carbon (OC %): Low < 0.5%, Medium 0.5% - 0.75%, High > 0.75%
    """

    @classmethod
    def classify_ph(cls, ph: Optional[float]) -> Dict[str, str]:
        if ph is None:
            return {"status": "unknown", "label": "Unknown / Not Tested", "description": "No pH test recorded"}
        if ph < 5.5:
            return {"status": "strongly_acidic", "label": "Strongly Acidic", "description": "Soil is acidic (pH < 5.5). May limit phosphorus availability and root elongation."}
        elif 5.5 <= ph < 6.5:
            return {"status": "moderately_acidic", "label": "Moderately Acidic", "description": "Soil is moderately acidic (pH 5.5 - 6.5). Well suited for tubers and tea, but may require lime for sensitive pulses."}
        elif 6.5 <= ph <= 7.5:
            return {"status": "neutral", "label": "Neutral / Optimal", "description": "Soil pH is in the optimal agronomic range (6.5 - 7.5) with maximum nutrient availability."}
        elif 7.5 < ph <= 8.5:
            return {"status": "slightly_alkaline", "label": "Slightly Alkaline", "description": "Soil pH is slightly alkaline (7.5 - 8.5). Common in black cotton soils of Maharashtra."}
        else:
            return {"status": "alkaline", "label": "Alkaline / Saline", "description": "Soil pH is alkaline (pH > 8.5). Micronutrient availability (zinc, iron) may be constrained."}

    @classmethod
    def classify_nitrogen(cls, n: Optional[float]) -> str:
        if n is None:
            return "unknown"
        if n < 280:
            return "low"
        elif n <= 560:
            return "medium"
        return "high"

    @classmethod
    def classify_phosphorus(cls, p: Optional[float]) -> str:
        if p is None:
            return "unknown"
        if p < 10:
            return "low"
        elif p <= 25:
            return "medium"
        return "high"

    @classmethod
    def classify_potassium(cls, k: Optional[float]) -> str:
        if k is None:
            return "unknown"
        if k < 110:
            return "low"
        elif k <= 280:
            return "medium"
        return "high"

    @classmethod
    def classify_organic_carbon(cls, oc: Optional[float]) -> str:
        if oc is None:
            return "unknown"
        if oc < 0.5:
            return "low"
        elif oc <= 0.75:
            return "medium"
        return "high"

    @classmethod
    def classify_moisture(cls, moisture: Optional[float]) -> str:
        if moisture is None:
            return "unknown"
        if moisture < 15.0:
            return "dry"
        elif moisture <= 40.0:
            return "adequate"
        return "saturated"

    @classmethod
    def interpret_soil(cls, profile: Optional[SoilProfile]) -> SoilInterpretationResponse:
        """
        Interprets a SoilProfile model into a structured SoilInterpretationResponse.
        Gracefully handles completely missing or partially filled soil tests.
        """
        if not profile:
            return SoilInterpretationResponse(
                soil_condition="untested",
                ph_status="unknown",
                nitrogen_status="unknown",
                phosphorus_status="unknown",
                potassium_status="unknown",
                organic_carbon_status="unknown",
                moisture_status="unknown",
                observations=[
                    "No soil test information recorded yet.",
                    "Add your soil type and pH to get more accurate crop recommendations."
                ],
                recommendations=[
                    "Conduct a standard Soil Health Card test at your nearest Krishi Vigyan Kendra (KVK).",
                    "Enter approximate soil type (e.g. Black, Red, Loamy) to enable initial soil intelligence."
                ],
                has_data=False,
                profile=None
            )

        ph_info = cls.classify_ph(profile.ph)
        n_status = cls.classify_nitrogen(profile.nitrogen)
        p_status = cls.classify_phosphorus(profile.phosphorus)
        k_status = cls.classify_potassium(profile.potassium)
        oc_status = cls.classify_organic_carbon(profile.organic_carbon)
        m_status = cls.classify_moisture(profile.moisture)

        observations: List[str] = []
        recommendations: List[str] = []

        # Soil type context
        soil_type = profile.soil_type or "Black"
        observations.append(f"Recorded Soil Type: {soil_type} Soil")

        # pH interpretation
        if profile.ph is not None:
            observations.append(f"Soil pH is {profile.ph} ({ph_info['label']}). {ph_info['description']}")
            if ph_info["status"] == "strongly_acidic":
                recommendations.append("Consider agricultural lime or dolomite application to raise soil pH toward 6.5.")
            elif ph_info["status"] == "alkaline":
                recommendations.append("Incorporate organic compost, gypsum, or green manuring (Dhaincha/Sunn hemp) to moderate alkalinity.")
        else:
            observations.append("Soil pH is not tested yet.")

        # Nutrients
        if n_status == "low":
            observations.append(f"Available Nitrogen level is Low ({profile.nitrogen} kg/ha).")
            recommendations.append("Apply split doses of nitrogenous fertilizers or well-decomposed Farmyard Manure (FYM) / Neem cake.")
        elif n_status == "medium":
            observations.append("Available Nitrogen is in the Medium / Balanced range.")
        elif n_status == "high":
            observations.append("Available Nitrogen is High. Avoid excess urea to prevent vegetative surge and insect vulnerability.")

        if p_status == "low":
            observations.append(f"Available Phosphorus is Low ({profile.phosphorus} kg/ha).")
            recommendations.append("Apply single superphosphate (SSP) or rock phosphate at basal sowing stage.")
        elif p_status == "high":
            observations.append("Phosphorus reserve is High.")

        if k_status == "low":
            observations.append(f"Available Potassium is Low ({profile.potassium} kg/ha).")
            recommendations.append("Supplement with Muriate of Potash (MOP) or sulphate of potash, especially during fruiting/bulb sizing.")
        elif k_status in ["medium", "high"]:
            observations.append("Available Potassium is sufficient for fruit quality and disease resistance.")

        if oc_status == "low":
            observations.append("Soil Organic Carbon (OC) is below 0.5% (Low).")
            recommendations.append("Increase organic matter via vermicompost, crop residue retention, and bio-fertilizers (Azotobacter / PSB).")
        elif oc_status == "high":
            observations.append("Soil Organic Carbon is Healthy (> 0.75%), providing strong microbial activity and water holding capacity.")

        if m_status == "dry":
            observations.append("Soil moisture is low. Crop may require scheduled irrigation depending on growth stage.")
        elif m_status == "saturated":
            observations.append("Soil moisture is high/saturated. Ensure adequate field drainage to prevent root hypoxia.")

        # Determine overall condition keyword
        condition = ph_info["status"] if ph_info["status"] != "unknown" else "moderate"

        return SoilInterpretationResponse(
            soil_condition=condition,
            ph_status=ph_info["status"],
            nitrogen_status=n_status,
            phosphorus_status=p_status,
            potassium_status=k_status,
            organic_carbon_status=oc_status,
            moisture_status=m_status,
            observations=observations,
            recommendations=recommendations,
            has_data=True,
            profile=SoilProfileResponse.model_validate(profile)
        )

    @classmethod
    def check_crop_soil_compatibility(cls, crop_name: str, profile: Optional[SoilProfile]) -> Dict[str, Any]:
        """
        Evaluates compatibility of a specific crop with the given soil profile.
        Returns score (0-100), status, reasons, and potential risks.
        """
        crop_data = get_crop_knowledge(crop_name)
        reasons = []
        risks = []
        score = 80  # Default base compatibility

        if not profile:
            return {
                "compatibility_score": 75,
                "status": "Partial Data",
                "reasons": ["Crop evaluated against standard regional soil baseline."],
                "risks": ["Add soil test values to get precise compatibility insights."],
            }

        # 1. Soil Type Match
        soil_type = profile.soil_type or "Black"
        compatible_soils = crop_data.get("compatible_soils", ["Loamy", "Black"])
        if any(s.lower() in soil_type.lower() for s in compatible_soils):
            reasons.append(f"{soil_type} soil is compatible with {crop_name}'s root structure.")
            score += 10
        else:
            risks.append(f"{soil_type} soil is less optimal than preferred {', '.join(compatible_soils)}.")
            score -= 15

        # 2. pH Match
        if profile.ph is not None:
            ph_min = crop_data.get("preferred_ph_min", 6.0)
            ph_max = crop_data.get("preferred_ph_max", 7.5)
            if ph_min <= profile.ph <= ph_max:
                reasons.append(f"Soil pH ({profile.ph}) is directly in {crop_name}'s optimal range ({ph_min} - {ph_max}).")
                score += 10
            elif abs(profile.ph - ph_min) <= 0.5 or abs(profile.ph - ph_max) <= 0.5:
                reasons.append(f"Soil pH ({profile.ph}) is slightly outside optimal ({ph_min} - {ph_max}) but manageable.")
                score -= 5
            else:
                risks.append(f"Soil pH ({profile.ph}) diverges significantly from {crop_name}'s preferred ({ph_min} - {ph_max}).")
                score -= 20

        # 3. Nutrient alignment
        n_status = cls.classify_nitrogen(profile.nitrogen)
        demanded_n = crop_data.get("nutrient_demand", {}).get("nitrogen", "medium")
        if demanded_n == "high" and n_status == "low":
            risks.append(f"{crop_name} demands high nitrogen, but recorded soil nitrogen is low.")
            score -= 10
        elif demanded_n == "medium" and n_status in ["medium", "high"]:
            reasons.append(f"Soil nitrogen supports {crop_name}'s vegetative requirements.")

        score = max(20, min(100, score))
        status_label = "Highly Compatible" if score >= 85 else ("Compatible" if score >= 70 else "Moderate / Requires Care")

        return {
            "compatibility_score": score,
            "status": status_label,
            "reasons": reasons,
            "risks": risks,
        }


soil_service = SoilService()
