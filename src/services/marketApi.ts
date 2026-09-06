import apiClient from "./api";
import { marketsByCrop } from "../data/demo";
import type { MarketQuote } from "../types";

export interface MarketPriceModel {
  id: number;
  market_id: number;
  crop_name: string;
  price: number;
  unit: string;
  date: string;
}

export interface MarketModel {
  id: number;
  name: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  prices?: MarketPriceModel[];
}

export const marketApi = {
  async getMarkets(district?: string): Promise<MarketQuote[]> {
    try {
      const url = district ? `/markets?district=${encodeURIComponent(district)}` : "/markets";
      const data = await apiClient.get<MarketModel[]>(url);
      if (data && data.length > 0) {
        return data.map((m, idx) => {
          const tomatoPrice = m.prices?.find((p) => p.crop_name.toLowerCase() === "tomato")?.price || (26.0 - idx * 1.5);
          const distance = 15.0 + idx * 10.0;
          const transport = Math.round(distance * 15.0);
          const handling = Math.round(distance * 0.8);
          const net = Math.round((tomatoPrice - (transport + handling) / 2400) * 10) / 10;

          return {
            id: `market-${m.id}`,
            name: m.name,
            crop: "Tomato",
            pricePerKg: tomatoPrice,
            demand: idx === 0 ? "High" : idx === 1 ? "High" : "Medium",
            distanceKm: distance,
            transportCost: transport,
            storageCost: 0,
            handlingLossKg: handling,
            netPerKg: net > 0 ? net : tomatoPrice - 2.0,
            recommended: idx === 0,
            trend: [tomatoPrice - 1.2, tomatoPrice - 0.5, tomatoPrice, tomatoPrice + 0.5],
          };
        });
      }
      return marketsByCrop.Tomato;
    } catch (error) {
      console.warn("[marketApi] Backend unavailable, using demo markets fallback:", error);
      return marketsByCrop.Tomato;
    }
  },

  async getMarket(id: number): Promise<MarketModel> {
    return apiClient.get<MarketModel>(`/markets/${id}`);
  },

  async getMarketPrices(marketId: number, cropName?: string): Promise<MarketPriceModel[]> {
    const url = cropName
      ? `/markets/${marketId}/prices?crop_name=${encodeURIComponent(cropName)}`
      : `/markets/${marketId}/prices`;
    return apiClient.get<MarketPriceModel[]>(url);
  },
};

export default marketApi;
