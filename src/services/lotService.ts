import { api } from "./http";
import type { LotRecord, OfferRecord } from "../types";

export const lotService = {
  async create(input: Omit<LotRecord, "id" | "status">): Promise<LotRecord> {
    return api.post(() => ({
      ...input,
      id: `KS-2026-${String(Math.floor(Math.random() * 80) + 20).padStart(3, "0")}`,
      status: "Open for Offers" as const,
    }));
  },
  async respondOffer(
    offer: OfferRecord,
    status: OfferRecord["status"],
  ): Promise<OfferRecord> {
    return api.post(() => ({ ...offer, status }));
  },
};
