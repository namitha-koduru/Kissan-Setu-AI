import { weatherApi } from "./weatherApi";
import { weatherByLocation } from "../data/demo";
import type { WeatherSnapshot } from "../types";

export const weatherService = {
  async get(location = "Nashik"): Promise<WeatherSnapshot> {
    try {
      return await weatherApi.getWeather(location);
    } catch {
      const key = Object.keys(weatherByLocation).find((k) =>
        location.toLowerCase().includes(k.toLowerCase())
      );
      return weatherByLocation[key ?? "Nashik"];
    }
  },
};
