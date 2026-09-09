import apiClient from "./api";
import { initialCrops } from "../data/demo";
import type { CropRecord, CropStage } from "../types";

export interface CropBackendModel {
  id: number;
  farmer_id: number;
  crop_name: string;
  variety?: string;
  acreage?: number;
  quantity: number;
  sowing_date?: string;
  expected_harvest_date?: string;
  growth_stage?: string;
  soil_type?: string;
  image_url?: string;
  ai_observation?: any;
  created_at: string;
}

export const cropApi = {
  async getFarmerCrops(farmerId: number = 1): Promise<CropRecord[]> {
    try {
      const data = await apiClient.get<CropBackendModel[]>(`/farmers/${farmerId}/crops`);
      if (data && data.length > 0) {
        return data.map((c) => ({
          id: `crop-${c.id}`,
          name: c.crop_name,
          variety: c.variety,
          quantityKg: c.quantity,
          sowingDate: c.sowing_date || "2026-06-15",
          stage: (c.growth_stage as CropStage) || "Near maturity",
          location: "Farm Location",
          expectedPrice: c.crop_name.toLowerCase().includes("tomato") ? 28 : c.crop_name.toLowerCase().includes("onion") ? 21 : 62,
          harvestEst: c.expected_harvest_date || "2026-09-08",
          harvestWindow: "2–4 days",
          recommendation: c.crop_name.toLowerCase().includes("tomato") ? "SELL" : "WAIT",
          bestMarket: "Regional APMC Mandi",
          netRealization: c.crop_name.toLowerCase().includes("tomato") ? 24.5 : 18.0,
          confidence: 94,
        }));
      }
      return initialCrops;
    } catch (error) {
      console.warn("[cropApi] Backend unavailable, using demo crops fallback:", error);
      return initialCrops;
    }
  },

  async getCrop(id: number): Promise<CropBackendModel> {
    return apiClient.get<CropBackendModel>(`/crops/${id}`);
  },

  async createCrop(crop: Omit<CropBackendModel, "id" | "created_at">): Promise<CropBackendModel> {
    return apiClient.post<CropBackendModel>("/crops", crop);
  },

  async updateCrop(id: number, crop: Partial<CropBackendModel>): Promise<CropBackendModel> {
    return apiClient.put<CropBackendModel>(`/crops/${id}`, crop);
  },

  async deleteCrop(id: number): Promise<void> {
    return apiClient.delete(`/crops/${id}`);
  },
};

export default cropApi;
