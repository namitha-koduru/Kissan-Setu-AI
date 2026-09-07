import apiClient from "./api";
import { buyers } from "../data/demo";
import type { BuyerListing } from "../types";

export interface BuyerBackendModel {
  id: number;
  name: string;
  organization?: string;
  location: string;
  phone?: string;
  email?: string;
  verified: boolean;
  rating: number;
  created_at: string;
}

export const buyerApi = {
  async getBuyers(location?: string, verifiedOnly?: boolean): Promise<BuyerListing[]> {
    try {
      const params = new URLSearchParams();
      if (location) params.append("location", location);
      if (verifiedOnly) params.append("verified_only", "true");

      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiClient.get<BuyerBackendModel[]>(`/buyers${query}`);

      if (data && data.length > 0) {
        return data.map((b, idx) => ({
          id: `buyer-${b.id}`,
          name: b.name,
          verified: b.verified,
          crop: idx % 3 === 0 ? "Tomato (Grade A)" : idx % 3 === 1 ? "Onion (Bhima)" : "Grapes (Thompson)",
          quantityKg: 2000 + idx * 1000,
          quality: "Grade A",
          offeredPrice: idx % 3 === 0 ? 25.5 : idx % 3 === 1 ? 19.5 : 56.0,
          distanceKm: 18 + idx * 12,
          deadlineDays: 3 + idx,
          location: b.location,
          paymentRating: `${b.rating}/5.0 (Prompt Settlement)`,
          deadlineDate: "2026-09-09",
        }));
      }
      return buyers;
    } catch (error) {
      console.warn("[buyerApi] Backend unavailable, using demo buyers fallback:", error);
      return buyers;
    }
  },

  async getBuyer(id: number): Promise<BuyerBackendModel> {
    return apiClient.get<BuyerBackendModel>(`/buyers/${id}`);
  },

  async createBuyer(buyer: Omit<BuyerBackendModel, "id" | "created_at">): Promise<BuyerBackendModel> {
    return apiClient.post<BuyerBackendModel>("/buyers", buyer);
  },
};

export default buyerApi;
