from typing import List, Optional
from pydantic import BaseModel


class WeatherForecastDay(BaseModel):
    day: str
    temperature: float
    rain_probability: int
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None
    condition: str


class WeatherResponse(BaseModel):
    location: str
    district: str
    state: str
    temperature: float
    humidity: int
    rain_probability: int
    wind_speed: float
    condition: str
    risk_level: str  # Low, Medium, High
    risk_note: str
    forecast_date: str
    agricultural_advisory: str
    forecast: List[WeatherForecastDay]
    is_mock: bool = True
