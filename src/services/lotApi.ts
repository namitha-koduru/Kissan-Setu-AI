import apiClient from "./api";
import { initialLots } from "../data/demo";
import type { LotRecord } from "../types";

export interface LotBackendModel {
  id: number;
  farmer_id: number;
  crop_id: number;
  buyer_id?: number;
  quantity: number;
  unit?: string;
  asking_price: number;
  quality?: string;
  quality_description?: string;
  harvest_date?: string;
  harvest_window?: string;
  location?: string;
  status?: string;
  image_id?: string;
  farmer_name?: string;
  farmer_role?: string;
  crop_name?: string;
  crop_variety?: string;
  image_url?: string;
  created_at: string;
}

export const lotApi = {
  async getFarmerLots(farmerId: number = 1): Promise<LotRecord[]> {
    try {
      const data = await apiClient.get<LotBackendModel[]>(`/farmers/${farmerId}/lots`);
      if (Array.isArray(data)) {
        return data.map((l) => ({
          id: `KS-2026-${String(l.id).padStart(3, "0")}`,
          crop: l.crop_name || (l.crop_id === 1 ? "Tomato" : l.crop_id === 2 ? "Onion" : "Produce"),
          quantityKg: l.quantity,
          quality: l.quality || "Grade A",
          harvestDate: l.harvest_date || "2026-09-08",
          location: l.location || "Farm Origin",
          expectedPrice: l.asking_price,
          status: (l.status as any) || "Open for Offers",
          interests: 3,
          createdDate: l.created_at ? l.created_at.slice(0, 10) : "2026-09-08",
        }));
      }
      return farmerId === 1 ? initialLots : [];
    } catch (error) {
      console.warn("[lotApi] Backend error fetching farmer lots:", error);
      return farmerId === 1 ? initialLots : [];
    }
  },

  async getAllLots(statusFilter?: string): Promise<any[]> {
    try {
      const url = statusFilter ? `/lots?status_filter=${encodeURIComponent(statusFilter)}` : "/lots";
      const data = await apiClient.get<LotBackendModel[]>(url);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((l) => ({
          id: `KS-LOT-${l.id}`,
          numericId: l.id,
          crop: l.crop_name || (l.crop_id === 1 ? "Tomato" : l.crop_id === 2 ? "Onion" : "Produce"),
          quantityKg: l.quantity,
          quality: l.quality || "Grade A",
          sellerName: l.farmer_name || "Registered Farmer",
          sellerRole: l.farmer_role || "Farmer",
          harvestDate: l.harvest_date || "2026-09-08",
          location: l.location || "Nashik, Maharashtra",
          expectedPrice: l.asking_price,
          status: l.status || "Open for Offers",
          distanceKm: 12,
          imageUrl: l.image_url,
          createdAt: l.created_at,
        }));
      }
      return [];
    } catch (error) {
      console.warn("[lotApi] Backend unavailable, using empty list:", error);
      return [];
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
        return data.map((l: any) => ({
          id: `KS-LOT-${l.id}`,
          numericId: l.id,
          crop: l.crop_name || l.crop || "Produce",
          quality: l.quality || "Grade A",
          sellerName: l.farmer_name || l.sellerName || "Registered Farmer",
          sellerRole: l.farmer_role || (l.farmer_count && l.farmer_count > 1 ? "FPO" : "Farmer"),
          quantityKg: l.quantity_kg || l.quantity || 500,
          expectedPrice: l.asking_price || l.expectedPrice || 30,
          location: l.location || "Nashik, Maharashtra",
          harvestDate: l.harvest_date || l.harvestDate || "2026-09-08",
          status: l.status || "Open for Offers",
          distanceKm: Math.round(l.distance_km || 12),
          imageUrl: l.image_url || l.imageUrl,
          createdAt: l.created_at,
        }));
      }
      // Direct fallback to GET /lots with open status
      const allLots = await this.getAllLots("Open for Offers");
      if (Array.isArray(allLots) && allLots.length > 0) {
        return allLots;
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
