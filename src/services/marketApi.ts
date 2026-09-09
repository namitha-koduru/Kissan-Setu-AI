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
  async getMarkets(district?: string, cropName: string = "Tomato"): Promise<MarketQuote[]> {
    try {
      const url = district ? `/markets?district=${encodeURIComponent(district)}` : "/markets";
      const data = await apiClient.get<MarketModel[]>(url);
      if (data && data.length > 0) {
        return data.map((m, idx) => {
          const matchedPriceObj = m.prices?.find((p) => p.crop_name.toLowerCase().includes(cropName.toLowerCase()));
          const cropPrice = matchedPriceObj ? matchedPriceObj.price : (cropName.toLowerCase().includes("cotton") ? 72.0 : cropName.toLowerCase().includes("potato") ? 19.5 : 26.0 - idx * 1.5);
          const distance = 15.0 + idx * 10.0;
          const transport = Math.round(distance * 15.0);
          const handling = Math.round(distance * 0.8);
          const net = Math.round((cropPrice - (transport + handling) / 2400) * 10) / 10;

          return {
            id: `market-${m.id}`,
            name: m.name,
            crop: cropName,
            pricePerKg: cropPrice,
            demand: idx === 0 ? "High" : idx === 1 ? "High" : "Medium",
            distanceKm: distance,
            transportCost: transport,
            storageCost: 0,
            handlingLossKg: handling,
            netPerKg: net > 0 ? net : cropPrice - 2.0,
            recommended: idx === 0,
            trend: [cropPrice - 1.2, cropPrice - 0.5, cropPrice, cropPrice + 0.5],
          };
        });
      }
      return (marketsByCrop as any)[cropName] || marketsByCrop.Tomato;
    } catch (error) {
      console.warn("[marketApi] Backend unavailable, using demo markets fallback:", error);
      return (marketsByCrop as any)[cropName] || marketsByCrop.Tomato;
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
