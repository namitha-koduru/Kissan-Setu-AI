import { marketsByCrop, tomatoTrend30, tomatoTrend7 } from "../data/demo";
import { api } from "./http";
import type { MarketQuote, PricePoint } from "../types";

export const marketService = {
  async list(crop = "Tomato"): Promise<MarketQuote[]> {
    return api.get(() => marketsByCrop[crop] ?? marketsByCrop.Tomato);
  },
  async getByCrop(crop: string): Promise<MarketQuote[]> {
    return this.list(crop);
  },
  async trend(range: "7d" | "30d"): Promise<PricePoint[]> {
    return api.get(() => (range === "30d" ? tomatoTrend30 : tomatoTrend7));
  },
};
