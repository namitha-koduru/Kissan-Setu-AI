import apiClient from "./api";
import { initialOffers } from "../data/demo";
import type { OfferRecord } from "../types";

export interface OfferBackendModel {
  id: number;
  lot_id: number;
  buyer_id: number;
  offered_price: number;
  status: string;
  created_at: string;
}

export const offerApi = {
  async getLotOffers(lotId: number = 1): Promise<OfferRecord[]> {
    try {
      const data = await apiClient.get<OfferBackendModel[]>(`/lots/${lotId}/offers`);
      if (data && data.length > 0) {
        return data.map((o) => ({
          id: `offer-${o.id}`,
          lotId: `KS-2026-${String(o.lot_id).padStart(3, "0")}`,
          buyerName: o.buyer_id === 1 ? "Sahyadri Farms FPC" : o.buyer_id === 2 ? "FreshToHome Supply" : "Reliance Fresh Hub",
          verified: true,
          pricePerKg: o.offered_price,
          quantityKg: 2400,
          quality: "Grade A",
          expiresInDays: "2 days",
          status: (o.status as any) || "Pending",
        }));
      }
      return initialOffers;
    } catch (error) {
      console.warn("[offerApi] Backend unavailable, using demo offers fallback:", error);
      return initialOffers;
    }
  },

  async createOffer(offer: Omit<OfferBackendModel, "id" | "created_at">): Promise<OfferBackendModel> {
    return apiClient.post<OfferBackendModel>("/offers", offer);
  },

  async updateOfferStatus(offerId: number, status: string): Promise<OfferBackendModel> {
    return apiClient.put<OfferBackendModel>(`/offers/${offerId}/status`, { status });
  },
};

export default offerApi;
