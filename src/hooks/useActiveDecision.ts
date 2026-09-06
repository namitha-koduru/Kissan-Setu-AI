import { useEffect, useState } from "react";
import { useAppState } from "../context/AppStateContext";
import { recommendationService } from "../services/recommendationService";
import { weatherService } from "../services/weatherService";
import type { RecommendationResult, WeatherSnapshot } from "../types";

export function useActiveDecision() {
  const { crops, activeCropId } = useAppState();
  const crop = crops.find((c) => c.id === activeCropId) ?? crops[0];
  const [rec, setRec] = useState<RecommendationResult | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!crop) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [r, w] = await Promise.all([
          recommendationService.get(crop),
          weatherService.get(crop.location),
        ]);
        if (!alive) return;
        setRec(r);
        setWeather(w);
      } catch {
        if (alive) setError("Decision data is being updated. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [crop]);

  return { crop, rec, weather, loading, error };
}
