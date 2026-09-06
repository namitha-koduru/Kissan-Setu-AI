"""
Weather Intelligence Service for KissanSetuAI.
Extracts actionable agricultural signals from meteorological data:
- Rain risk (low / medium / high)
- Spraying feasibility risk (safe / caution / avoid)
- Irrigation adjustment advisory (skip / reduced / normal / increase)
- Harvest weather risk (low / medium / high)
- Foliar disease / pest spread vulnerability
- Heat / cold temperature stress
"""

from typing import Dict, Any, List, Optional
from app.services.weather_service import weather_service
from app.schemas.weather import WeatherResponse
from app.schemas.farm_intelligence import WeatherSignals, FarmRecommendationItem


class WeatherIntelligenceService:
    """
    Transforms raw weather observations & forecasts into conservative, actionable farming advisories.
    """

    @classmethod
    def extract_weather_signals(cls, location_or_district: str = "Nashik") -> WeatherSignals:
        try:
            weather: WeatherResponse = weather_service.get_weather_for_location(location_or_district)
        except Exception:
            # Safe default fallback
            return WeatherSignals(
                rain_risk="low",
                rain_probability=20,
                spraying_risk="safe",
                irrigation_need="normal",
                harvest_weather_risk="low",
                temperature_stress="normal",
                advisories=["Weather service temporarily offline. Assuming normal seasonal conditions."]
            )

        rain_prob = weather.rain_probability
        temp = weather.temperature
        wind = weather.wind_speed
        humidity = weather.humidity

        # Look at multi-day forecast for rain trends
        max_forecast_rain = rain_prob
        if weather.forecast:
            max_forecast_rain = max([f.rain_probability for f in weather.forecast[:3]] + [rain_prob])

        # 1. Rain Risk
        if max_forecast_rain >= 60:
            rain_risk = "high"
        elif max_forecast_rain >= 30:
            rain_risk = "medium"
        else:
            rain_risk = "low"

        # 2. Spraying Risk
        # Avoid spraying if rain probability >= 50% or wind > 18 km/h (drift loss)
        if rain_prob >= 50 or max_forecast_rain >= 65:
            spraying_risk = "avoid"
        elif rain_prob >= 30 or wind > 14.0:
            spraying_risk = "caution"
        else:
            spraying_risk = "safe"

        # 3. Irrigation Need
        if max_forecast_rain >= 65 or rain_prob >= 60:
            irrigation_need = "skip"
        elif max_forecast_rain >= 40:
            irrigation_need = "reduced"
        elif temp > 35.0 or (temp > 30.0 and humidity < 40):
            irrigation_need = "increase"
        else:
            irrigation_need = "normal"

        # 4. Harvest Weather Risk
        if max_forecast_rain >= 60:
            harvest_weather_risk = "high"
        elif max_forecast_rain >= 35:
            harvest_weather_risk = "medium"
        else:
            harvest_weather_risk = "low"

        # 5. Temperature Stress
        if temp >= 36.0:
            temp_stress = "heat_stress"
        elif temp <= 10.0:
            temp_stress = "cold_stress"
        elif 20.0 <= temp <= 30.0:
            temp_stress = "optimal"
        else:
            temp_stress = "normal"

        # 6. Advisories
        advisories: List[str] = []
        if rain_risk == "high":
            advisories.append("High rainfall expected within the next 48-72 hours. Inspect field drainage to prevent water stagnation.")
        if spraying_risk == "avoid":
            advisories.append("Avoid chemical or foliar sprays immediately before rain to prevent pesticide runoff and wash-off.")
        elif spraying_risk == "caution":
            advisories.append("Moderate rain or wind expected; spray only during calm morning hours with adjuvant stickers.")
        
        if irrigation_need == "skip":
            advisories.append("Skip or postpone irrigation today as sufficient rainfall is anticipated.")
        elif irrigation_need == "increase":
            advisories.append("High ambient temperature detected; maintain morning drip irrigation to prevent moisture stress.")
            
        if harvest_weather_risk == "high":
            advisories.append("Mature or ready-to-harvest lots should be picked or covered before the upcoming precipitation.")

        if humidity > 75 and temp > 24.0:
            advisories.append("High humidity coupled with warm temperatures increases susceptibility to fungal blights and mildew.")

        if not advisories:
            advisories.append("Favorable field weather conditions for general agronomic operations.")

        return WeatherSignals(
            rain_risk=rain_risk,
            rain_probability=rain_prob,
            spraying_risk=spraying_risk,
            irrigation_need=irrigation_need,
            harvest_weather_risk=harvest_weather_risk,
            temperature_stress=temp_stress,
            advisories=advisories
        )


weather_intelligence_service = WeatherIntelligenceService()
