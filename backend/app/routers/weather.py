from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.weather import WeatherResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("", response_model=WeatherResponse)
@router.get("/", response_model=WeatherResponse)
def get_weather(
    location: Optional[str] = Query("Nashik", description="District or location name (e.g. Nashik, Pune, Nagpur)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude")
):
    """
    Get weather data and agricultural risk advisories.
    Currently returns high-fidelity mock data designed for easy swap with IMD / OpenWeather in Phase 2.
    """
    return weather_service.get_weather_for_location(location or "Nashik")
