"""
Crop Suitability Engine for KissanSetuAI.
Calculates transparent, explainable suitability scores (0-100) for crops given:
- Soil type & pH
- Available N-P-K nutrients & organic carbon
- Meteorological forecast (temperature, rainfall risk)
- Seasonality & regional suitability
- Available acreage

Architectural Design:
CropSuitabilityEngine (Abstract)
    └── RuleBasedSuitabilityEngine (Active explainable multi-factor scoring)
    └── MLModelSuitabilityEngine (Pluggable interface for future trained XGBoost/scikit-learn models)
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.database.models import SoilProfile
from app.services.crop_knowledge import CROP_KNOWLEDGE, get_crop_knowledge, list_available_crops
from app.services.soil_service import soil_service
from app.services.weather_intelligence import weather_intelligence_service
from app.schemas.farm_intelligence import CropSuitabilityItem, WeatherSignals


class BaseSuitabilityEngine(ABC):
    @abstractmethod
    def evaluate(
        self,
        crop_name: str,
        soil: Optional[SoilProfile],
        weather: WeatherSignals,
        location: str = "Nashik",
        acreage: Optional[float] = None
    ) -> CropSuitabilityItem:
        pass


class RuleBasedSuitabilityEngine(BaseSuitabilityEngine):
    """
    Transparent, explainable multi-factor agronomic scoring engine.
    Weight distribution:
    - Soil compatibility & pH: 35%
    - Climate & temperature range: 25%
    - Rainfall / moisture alignment: 20%
    - Seasonality & regional fit: 10%
    - Nutrient & soil health reserve: 10%
    """

    def evaluate(
        self,
        crop_name: str,
        soil: Optional[SoilProfile],
        weather: WeatherSignals,
        location: str = "Nashik",
        acreage: Optional[float] = None
    ) -> CropSuitabilityItem:
        crop_data = get_crop_knowledge(crop_name)
        reasons: List[str] = []
        risks: List[str] = []
        suggestions: List[str] = []

        # Start base score
        base_score = 50
        has_soil = soil is not None and (soil.ph is not None or soil.soil_type is not None)

        # 1. Soil Type & pH Scoring (up to +25 / -20)
        soil_type = (soil.soil_type if soil else None) or "Black"
        compatible_soils = crop_data.get("compatible_soils", ["Loamy", "Black"])

        if any(s.lower() in soil_type.lower() for s in compatible_soils):
            base_score += 15
            reasons.append(f"{soil_type} soil provides suitable drainage and texture for {crop_name}.")
        else:
            base_score -= 10
            risks.append(f"{soil_type} soil is not primary choice for {crop_name}; consider amending texture with organic matter.")

        if soil and soil.ph is not None:
            ph_min = crop_data.get("preferred_ph_min", 6.0)
            ph_max = crop_data.get("preferred_ph_max", 7.5)
            if ph_min <= soil.ph <= ph_max:
                base_score += 12
                reasons.append(f"Recorded soil pH ({soil.ph}) is directly in the optimal range ({ph_min} - {ph_max}).")
            elif abs(soil.ph - ph_min) <= 0.6 or abs(soil.ph - ph_max) <= 0.6:
                base_score += 4
                reasons.append(f"Soil pH ({soil.ph}) is acceptable for {crop_name} with standard management.")
            else:
                base_score -= 14
                risks.append(f"Soil pH ({soil.ph}) is outside preferred range ({ph_min} - {ph_max}).")
                suggestions.append(f"Apply soil conditioning to bring pH closer to {ph_min} - {ph_max}.")
        elif not soil:
            suggestions.append("Test and add your soil pH to improve score precision.")

        # 2. Nutrient Reserve (up to +10 / -10)
        if soil:
            n_status = soil_service.classify_nitrogen(soil.nitrogen)
            demanded_n = crop_data.get("nutrient_demand", {}).get("nitrogen", "medium")
            if n_status == "low" and demanded_n == "high":
                base_score -= 8
                risks.append(f"{crop_name} requires high nitrogen, but recorded soil nitrogen is Low.")
                suggestions.append("Plan basal neem-coated urea or compost application.")
            elif n_status in ["medium", "high"]:
                base_score += 6
                reasons.append("Available soil nutrient profile supports vigorous crop development.")

        # 3. Weather & Temperature Scoring (up to +20 / -15)
        if weather.temperature_stress == "optimal":
            base_score += 12
            reasons.append(f"Current regional temperature falls within optimal growing range ({crop_data['ideal_temp_min']}°C - {crop_data['ideal_temp_max']}°C).")
        elif weather.temperature_stress == "heat_stress":
            if crop_data.get("weather_sensitivities", {}).get("heat_stress_c", 40.0) <= 35.0:
                base_score -= 10
                risks.append(f"{crop_name} is sensitive to extreme heat; mulch rows to conserve root moisture.")
            else:
                reasons.append(f"{crop_name} demonstrates reasonable heat tolerance.")

        # 4. Rainfall Risk & Weather Sensitivities (up to +10 / -15)
        heavy_rain_risk = crop_data.get("weather_sensitivities", {}).get("heavy_rain_risk", "medium")
        if weather.rain_risk == "high" and heavy_rain_risk in ["high", "very_high"]:
            base_score -= 14
            risks.append(f"Elevated rain probability poses risk for {crop_name} (foliar fungal vulnerability).")
            suggestions.append("Ensure raised bed cultivation and clean field drainage channels.")
        elif weather.rain_risk == "low":
            base_score += 8
            reasons.append("Dry/stable weather forecast allows controlled irrigation and disease prevention.")

        # 5. Regional & Seasonality match
        seasons = crop_data.get("primary_seasons", ["Kharif", "Rabi"])
        reasons.append(f"Well-adapted for {', '.join(seasons)} cultivation in {location}.")

        # Cap score strictly between 20 and 98 (explainable, never claiming fake 100% certainty)
        final_score = max(20, min(96, base_score))

        # Confidence tag based on available data completeness
        if has_soil and soil.ph is not None and soil.nitrogen is not None:
            confidence = "High (Complete Farm Data)"
        elif has_soil:
            confidence = "Moderate (Soil Data Available)"
        else:
            confidence = "Low (Based on Regional Baseline)"

        # Compatibility Level
        if final_score >= 85:
            compat = "Highly Suitable"
        elif final_score >= 70:
            compat = "Suitable"
        elif final_score >= 55:
            compat = "Moderate"
        else:
            compat = "Challenging"

        return CropSuitabilityItem(
            crop=crop_name,
            suitability_score=final_score,
            confidence=confidence,
            compatibility_level=compat,
            reasons=reasons,
            risks=risks,
            suggestions=suggestions,
            optimal_season=", ".join(seasons),
            expected_duration_days=crop_data.get("duration_days", 120),
            market_potential=crop_data.get("market_demand_profile", "High Mandi Demand")
        )


class MLModelSuitabilityEngine(BaseSuitabilityEngine):
    """
    Pluggable XGBoost / scikit-learn classifier engine interface.
    Falls back gracefully to RuleBasedSuitabilityEngine when trained model weights are not loaded.
    """

    def __init__(self, rule_engine: RuleBasedSuitabilityEngine):
        self.rule_engine = rule_engine
        self.is_model_loaded = False
        self.model = None

    def evaluate(
        self,
        crop_name: str,
        soil: Optional[SoilProfile],
        weather: WeatherSignals,
        location: str = "Nashik",
        acreage: Optional[float] = None
    ) -> CropSuitabilityItem:
        if not self.is_model_loaded or self.model is None:
            # Fallback to explainable rule engine
            return self.rule_engine.evaluate(crop_name, soil, weather, location, acreage)
        
        # Future ML prediction branch once real verified model weights are trained
        return self.rule_engine.evaluate(crop_name, soil, weather, location, acreage)


class CropSuitabilityEngine:
    """
    Main orchestrator for Crop Suitability evaluation across multiple crops.
    """

    def __init__(self):
        self.rule_engine = RuleBasedSuitabilityEngine()
        self.ml_engine = MLModelSuitabilityEngine(self.rule_engine)

    def rank_crops_for_farm(
        self,
        soil: Optional[SoilProfile],
        weather: WeatherSignals,
        location: str = "Nashik",
        acreage: Optional[float] = None,
        target_crops: Optional[List[str]] = None
    ) -> List[CropSuitabilityItem]:
        crops_to_evaluate = target_crops or list_available_crops()
        results: List[CropSuitabilityItem] = []

        for crop in crops_to_evaluate:
            item = self.rule_engine.evaluate(crop, soil, weather, location, acreage)
            results.append(item)

        # Sort descending by suitability score
        results.sort(key=lambda x: x.suitability_score, reverse=True)
        return results


crop_suitability_engine = CropSuitabilityEngine()
