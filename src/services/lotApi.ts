import apiClient from "./api";
import { initialLots } from "../data/demo";
import type { LotRecord } from "../types";

export interface LotBackendModel {
  id: number;
  farmer_id: number;
  crop_id: number;
  buyer_id?: number;
  quantity: number;
  asking_price: number;
  quality?: string;
  harvest_date?: string;
  location?: string;
  status?: string;
  created_at: string;
}

export const lotApi = {
  async getFarmerLots(farmerId: number = 1): Promise<LotRecord[]> {
    try {
      const data = await apiClient.get<LotBackendModel[]>(`/farmers/${farmerId}/lots`);
      if (data && data.length > 0) {
        return data.map((l) => ({
          id: `KS-2026-${String(l.id).padStart(3, "0")}`,
          crop: l.crop_id === 1 ? "Tomato" : l.crop_id === 2 ? "Onion" : "Grapes",
          quantityKg: l.quantity,
          quality: l.quality || "Grade A",
          harvestDate: l.harvest_date || "2026-09-08",
          location: l.location || "Farm Origin",
          expectedPrice: l.asking_price,
          status: (l.status as any) || "Open for Offers",
          interests: 3,
          createdDate: l.created_at.slice(0, 10),
        }));
      }
      return initialLots;
    } catch (error) {
      console.warn("[lotApi] Backend unavailable, using demo lots fallback:", error);
      return initialLots;
    }
  },

  async getAllLots(statusFilter?: string): Promise<LotRecord[]> {
    try {
      const url = statusFilter ? `/lots?status_filter=${encodeURIComponent(statusFilter)}` : "/lots";
      const data = await apiClient.get<LotBackendModel[]>(url);
      if (data && data.length > 0) {
        return data.map((l) => ({
          id: `KS-2026-${String(l.id).padStart(3, "0")}`,
          crop: l.crop_id === 1 ? "Tomato" : l.crop_id === 2 ? "Onion" : "Grapes",
          quantityKg: l.quantity,
          quality: l.quality || "Grade A",
          harvestDate: l.harvest_date || "2026-09-08",
          location: l.location || "Farm Origin",
          expectedPrice: l.asking_price,
          status: (l.status as any) || "Open for Offers",
          interests: 2,
        }));
      }
      return initialLots;
    } catch (error) {
      console.warn("[lotApi] Backend unavailable, using demo lots fallback:", error);
      return initialLots;
    }
  },

  async createLot(lot: Omit<LotBackendModel, "id" | "created_at">): Promise<LotBackendModel> {
    return apiClient.post<LotBackendModel>("/lots", lot);
  },

  async updateLot(id: number, lot: Partial<LotBackendModel>): Promise<LotBackendModel> {
    return apiClient.put<LotBackendModel>(`/lots/${id}`, lot);
  },
};

export default lotApi;
