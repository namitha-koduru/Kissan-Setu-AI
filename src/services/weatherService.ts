import { weatherApi } from "./weatherApi";
import type { WeatherSnapshot } from "../types";

export const weatherService = {
  async get(location = ""): Promise<WeatherSnapshot> {
    return weatherApi.getWeather(location);
  },
};
