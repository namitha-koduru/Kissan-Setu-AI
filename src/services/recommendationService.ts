import { decideAction } from "../engine/recommendation";
import { marketsByCrop, tomatoTrend7 } from "../data/demo";
import { weatherService } from "./weatherService";
import { api } from "./http";
import type { CropRecord, RecommendationResult } from "../types";

export const recommendationService = {
  async get(crop: CropRecord): Promise<RecommendationResult> {
    const weather = await weatherService.get(crop.location);
    const markets = marketsByCrop[crop.name] ?? marketsByCrop.Tomato;
    const trend = tomatoTrend7;
    const priceTrendDelta = trend[trend.length - 1].price - trend[0].price;
    return api.get(() =>
      decideAction({ crop, weather, markets, priceTrendDelta }),
    );
  },
};
