from datetime import datetime, timedelta
from typing import Dict, Any
from app.schemas.weather import WeatherResponse, WeatherForecastDay


class WeatherService:
    """
    Weather Service abstraction.
    Returns structured meteorological data and agricultural risk advisories.
    Designed for seamless future integration with real external APIs (e.g. OpenWeather / IMD).
    """

    MOCK_DISTRICTS: Dict[str, Dict[str, Any]] = {
        "Nashik": {
            "temperature": 28.5,
            "humidity": 68,
            "rain_probability": 35,
            "wind_speed": 12.4,
            "condition": "Partly Cloudy",
            "risk_level": "Medium",
            "risk_note": "Precipitation probability expected to surge to 70% after Day 2.",
            "agricultural_advisory": "Rain risk increases after 48 hours. Consider harvesting mature tomato lots before the high-risk window.",
        },
        "Pune": {
            "temperature": 27.0,
            "humidity": 55,
            "rain_probability": 18,
            "wind_speed": 10.2,
            "condition": "Clear Skies",
            "risk_level": "Low",
            "risk_note": "Weather conditions are stable for the next 5 days.",
            "agricultural_advisory": "Optimal dry conditions for vegetative growth and soil fertilization.",
        },
        "Nagpur": {
            "temperature": 31.5,
            "humidity": 42,
            "rain_probability": 10,
            "wind_speed": 8.5,
            "condition": "Hot & Dry",
            "risk_level": "Low",
            "risk_note": "High daytime temperatures with very low precipitation risk.",
            "agricultural_advisory": "Maintain regular drip irrigation during early morning to minimize transit handling loss.",
        },
        "Ahmednagar": {
            "temperature": 29.0,
            "humidity": 58,
            "rain_probability": 22,
            "wind_speed": 11.0,
            "condition": "Mostly Clear",
            "risk_level": "Medium",
            "risk_note": "Scattered cloud cover expected from Day 3.",
            "agricultural_advisory": "Good window for pesticide application before potential midweek showers.",
        },
        "Kolhapur": {
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
    def get_weather_for_location(cls, location_or_district: str = "Nashik") -> WeatherResponse:
        district_key = "Nashik"
        for key in cls.MOCK_DISTRICTS:
            if key.lower() in location_or_district.lower():
                district_key = key
                break

        data = cls.MOCK_DISTRICTS[district_key]
        today = datetime.now()

        forecast_days = []
        labels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
        conditions = [data["condition"], "Partly Cloudy", "Rain Showers", "Heavy Showers", "Cloudy", "Mostly Sunny", "Sunny"]
        rain_probs = [data["rain_probability"], 25, 70, 80, 55, 20, 15]

        for i in range(7):
            forecast_days.append(
                WeatherForecastDay(
                    day=labels[i],
                    temperature=round(data["temperature"] + (i * 0.4 - 1.0), 1),
                    rain_probability=rain_probs[i],
                    humidity=min(95, max(30, data["humidity"] + (i * 2 - 4))),
                    wind_speed=data["wind_speed"],
                    condition=conditions[i],
                )
            )

        return WeatherResponse(
            location=f"{district_key}, Maharashtra",
            district=district_key,
            state="Maharashtra",
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
