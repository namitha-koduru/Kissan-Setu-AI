import { buyers } from "../data/demo";
import { api } from "./http";
import type { BuyerListing } from "../types";

export const buyerService = {
  async list(crop?: string): Promise<BuyerListing[]> {
    return api.get(() => (crop ? buyers.filter((b) => b.crop === crop) : buyers));
  },
  async get(id: string): Promise<BuyerListing | undefined> {
    return api.get(() => buyers.find((b) => b.id === id));
  },
};
