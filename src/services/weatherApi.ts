import apiClient from "./api";
import { weatherByLocation } from "../data/demo";
import type { WeatherSnapshot, RiskLevel } from "../types";

export interface WeatherBackendForecastDay {
  day: string;
  temperature: number;
  rain_probability: number;
  humidity?: number;
  wind_speed?: number;
  condition: string;
}

export interface WeatherBackendResponse {
  location: string;
  district: string;
  state: string;
  temperature: number;
  humidity: number;
  rain_probability: number;
  wind_speed: number;
  condition: string;
  risk_level: string;
  risk_note: string;
  forecast_date: string;
  agricultural_advisory: string;
  forecast: WeatherBackendForecastDay[];
  is_mock: boolean;
}

export const weatherApi = {
  async getWeather(location: string = "Nashik"): Promise<WeatherSnapshot> {
    try {
      const data = await apiClient.get<WeatherBackendResponse>(
        `/weather?location=${encodeURIComponent(location)}`
      );
      return {
        location: data.location || `${location}, Maharashtra`,
        currentTempC: data.temperature,
        condition: data.condition,
        rainProbability: data.rain_probability,
        humidity: data.humidity,
        risk: (data.risk_level as RiskLevel) || "Medium",
        riskNote: data.risk_note || data.agricultural_advisory,
        demo: data.is_mock,
        forecast: (data.forecast || []).map((f) => ({
          day: f.day,
          tempC: f.temperature,
          rainProbability: f.rain_probability,
          humidity: f.humidity,
          condition: f.condition,
        })),
      };
    } catch (error) {
      console.warn("[weatherApi] Backend unavailable, using demo weather fallback:", error);
      const key = Object.keys(weatherByLocation).find((k) =>
        location.toLowerCase().includes(k.toLowerCase())
      );
      return weatherByLocation[key ?? "Nashik"];
    }
  },
};

export default weatherApi;
