import { cropOptions } from "../data/demo";
import { api } from "./http";
import type { CropRecord } from "../types";

export const cropService = {
  options() {
    return cropOptions;
  },
  async create(input: Omit<CropRecord, "id">): Promise<CropRecord> {
    return api.post(() => ({
      ...input,
      id: `crop-${Date.now()}`,
    }));
  },
};
