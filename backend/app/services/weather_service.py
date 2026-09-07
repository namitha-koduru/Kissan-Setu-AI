from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from app.schemas.weather import WeatherResponse, WeatherForecastDay


class WeatherService:
    """
    Weather Service abstraction.
    Returns structured meteorological data and agricultural risk advisories.
    Designed for seamless integration with real external APIs (e.g. OpenWeather / IMD).
    """

    REGIONAL_PROFILES: Dict[str, Dict[str, Any]] = {
        "guntur": {
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "temperature": 32.0,
            "humidity": 65,
            "rain_probability": 25,
            "wind_speed": 11.5,
            "condition": "Partly Cloudy",
            "risk_level": "Low",
            "risk_note": "Stable weather conditions in coastal/delta agricultural belt.",
            "agricultural_advisory": "Good window for intercultural operations and targeted micro-irrigation for chilli and commercial crops.",
        },
        "vadlamudi": {
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "temperature": 31.8,
            "humidity": 66,
            "rain_probability": 22,
            "wind_speed": 10.8,
            "condition": "Mostly Clear",
            "risk_level": "Low",
            "risk_note": "Favorable dry spell expected over the next 4 days.",
            "agricultural_advisory": "Favorable climate for harvest preparation and dry storage packing.",
        },
        "krishna": {
            "district": "Krishna",
            "state": "Andhra Pradesh",
            "temperature": 32.5,
            "humidity": 70,
            "rain_probability": 30,
            "wind_speed": 13.0,
            "condition": "Humid & Partly Cloudy",
            "risk_level": "Low",
            "risk_note": "Moderate coastal humidity with low immediate precipitation risk.",
            "agricultural_advisory": "Maintain adequate field drainage in low-lying parcels.",
        },
        "nashik": {
            "district": "Nashik",
            "state": "Maharashtra",
            "temperature": 28.5,
            "humidity": 68,
            "rain_probability": 35,
            "wind_speed": 12.4,
            "condition": "Partly Cloudy",
            "risk_level": "Medium",
            "risk_note": "Precipitation probability expected to surge to 70% after Day 2.",
            "agricultural_advisory": "Rain risk increases after 48 hours. Consider harvesting mature lots before the high-risk window.",
        },
        "pune": {
            "district": "Pune",
            "state": "Maharashtra",
            "temperature": 27.0,
            "humidity": 55,
            "rain_probability": 18,
            "wind_speed": 10.2,
            "condition": "Clear Skies",
            "risk_level": "Low",
            "risk_note": "Weather conditions are stable for the next 5 days.",
            "agricultural_advisory": "Optimal dry conditions for vegetative growth and soil fertilization.",
        },
        "nagpur": {
            "district": "Nagpur",
            "state": "Maharashtra",
            "temperature": 31.5,
            "humidity": 42,
            "rain_probability": 10,
            "wind_speed": 8.5,
            "condition": "Hot & Dry",
            "risk_level": "Low",
            "risk_note": "High daytime temperatures with very low precipitation risk.",
            "agricultural_advisory": "Maintain regular drip irrigation during early morning to minimize transit handling loss.",
        },
        "ahmednagar": {
            "district": "Ahmednagar",
            "state": "Maharashtra",
            "temperature": 29.0,
            "humidity": 58,
            "rain_probability": 22,
            "wind_speed": 11.0,
            "condition": "Mostly Clear",
            "risk_level": "Medium",
            "risk_note": "Scattered cloud cover expected from Day 3.",
            "agricultural_advisory": "Good window for pesticide application before potential midweek showers.",
        },
        "kolhapur": {
            "district": "Kolhapur",
            "state": "Maharashtra",
            "temperature": 26.0,
            "humidity": 75,
            "rain_probability": 45,
            "wind_speed": 14.1,
            "condition": "Cloudy with Drizzle",
            "risk_level": "Medium",
            "risk_note": "Persistent humidity may increase fungal vulnerability in onion crops.",
            "agricultural_advisory": "Ensure proper drainage in low-lying parcels to prevent waterlogging.",
        },
    }

    @classmethod
    def resolve_location_meta(cls, location_or_district: str) -> Tuple[str, str, str, Dict[str, Any]]:
        raw = location_or_district.strip()
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        
        # Match against known regional keys
        matched_profile = None
        for key, profile in cls.REGIONAL_PROFILES.items():
            if key in raw.lower():
                matched_profile = profile
                break

        if matched_profile:
            district = matched_profile["district"]
            state = matched_profile["state"]
            location = raw if len(parts) > 1 else f"{district}, {state}"
            return location, district, state, matched_profile

        # Fallback for arbitrary Indian districts/states
        if len(parts) >= 3:
            district = parts[-2]
            state = parts[-1]
            location = raw
        elif len(parts) == 2:
            district = parts[0]
            state = parts[1]
            location = raw
        else:
            district = parts[0] if parts else "Local Farm"
            state = "India"
            location = f"{district}, {state}"

        fallback_data = {
            "district": district,
            "state": state,
            "temperature": 29.5,
            "humidity": 62,
            "rain_probability": 20,
            "wind_speed": 11.0,
            "condition": "Partly Cloudy",
            "risk_level": "Low",
            "risk_note": f"Weather conditions for {district}, {state} remain largely favorable for harvest operations.",
            "agricultural_advisory": f"Local meteorological risk is within normal bounds for {district}. Proceed with planned crop schedule.",
        }
        return location, district, state, fallback_data

    @classmethod
    def get_weather_for_location(cls, location_or_district: str = "Nashik") -> WeatherResponse:
        location, district, state, data = cls.resolve_location_meta(location_or_district)
        today = datetime.now()

        forecast_days = []
        labels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
        conditions = [data["condition"], "Partly Cloudy", "Mostly Clear", "Scattered Clouds", "Cloudy", "Mostly Sunny", "Sunny"]
        rain_probs = [data["rain_probability"], max(10, data["rain_probability"] - 5), min(80, data["rain_probability"] + 15), min(75, data["rain_probability"] + 20), max(15, data["rain_probability"] + 5), 15, 10]

        for i in range(7):
            forecast_days.append(
                WeatherForecastDay(
                    day=labels[i],
                    temperature=round(data["temperature"] + (i * 0.3 - 0.6), 1),
                    rain_probability=rain_probs[i],
                    humidity=min(95, max(30, data["humidity"] + (i * 2 - 3))),
                    wind_speed=data["wind_speed"],
                    condition=conditions[i],
                )
            )

        return WeatherResponse(
            location=location,
            district=district,
            state=state,
            temperature=data["temperature"],
            humidity=data["humidity"],
            rain_probability=data["rain_probability"],
            wind_speed=data["wind_speed"],
            condition=data["condition"],
            risk_level=data["risk_level"],
            risk_note=data["risk_note"],
            forecast_date=today.strftime("%Y-%m-%d"),
            agricultural_advisory=data["agricultural_advisory"],
            forecast=forecast_days,
            is_mock=True,
        )


weather_service = WeatherService()
