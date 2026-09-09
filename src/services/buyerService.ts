import { buyers } from "../data/demo";
import { api } from "./http";
import type { BuyerListing } from "../types";

export const buyerService = {
  async list(crop?: string): Promise<BuyerListing[]> {
    return api.get(() => (crop ? buyers.filter((b: BuyerListing) => b.crop.toLowerCase() === crop.toLowerCase()) : buyers));
  },
  async get(id: string): Promise<BuyerListing | undefined> {
    return api.get(() => buyers.find((b: BuyerListing) => b.id === id || b.id === `buyer-${id}` || b.id === `b-${id}`));
  },
};
