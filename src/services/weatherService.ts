import { weatherByLocation } from "../data/demo";
import { api } from "./http";
import type { WeatherSnapshot } from "../types";

export const weatherService = {
  async get(location = "Nashik"): Promise<WeatherSnapshot> {
    return api.get(() => {
      const key = Object.keys(weatherByLocation).find((k) =>
        location.toLowerCase().includes(k.toLowerCase()),
      );
      return weatherByLocation[key ?? "Nashik"];
    });
  },
};
