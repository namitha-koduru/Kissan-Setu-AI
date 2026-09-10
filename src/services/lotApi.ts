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
      if (Array.isArray(data)) {
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
      return farmerId === 1 ? initialLots : [];
    } catch (error) {
      console.warn("[lotApi] Backend error fetching farmer lots:", error);
      return farmerId === 1 ? initialLots : [];
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

  async discoverNearbyLots(buyerLocation?: string, crop?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (buyerLocation) params.append("buyer_location", buyerLocation);
      if (crop && crop !== "All") params.append("crop", crop);
      const url = `/lots/nearby/discovery?${params.toString()}`;
      const data = await apiClient.get<any[]>(url);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      // Fallback to GET /lots with open status filter
      const allLots = await apiClient.get<LotBackendModel[]>("/lots");
      if (Array.isArray(allLots) && allLots.length > 0) {
        return allLots
          .filter((l) => !l.status || l.status === "Open for Offers" || l.status === "OPEN" || l.status === "Active")
          .map((l) => ({
            id: l.id,
            crop_id: l.crop_id,
            crop_name: l.crop_id === 1 ? "Tomato" : l.crop_id === 2 ? "Onion" : "Produce",
            farmer_id: l.farmer_id,
            farmer_name: "Farmer Producer",
            quantity_kg: l.quantity,
            asking_price: l.asking_price,
            quality: l.quality || "Grade A",
            location: l.location || "Farm Origin",
            distance_km: 12,
            status: l.status || "Open for Offers",
          }));
      }
      return [];
    } catch (error) {
      console.warn("[lotApi] Error fetching nearby lots:", error);
      return [];
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
