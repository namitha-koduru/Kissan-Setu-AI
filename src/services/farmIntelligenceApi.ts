import apiClient from "./api";
import type { SoilInterpretation } from "./soilApi";


export interface WeatherSignals {
  rain_risk: "low" | "medium" | "high";
  rain_probability: number;
  spraying_risk: "safe" | "caution" | "avoid";
  irrigation_need: "skip" | "reduced" | "normal" | "increase";
  harvest_weather_risk: "low" | "medium" | "high";
  temperature_stress: "heat_stress" | "cold_stress" | "optimal" | "normal";
  advisories: string[];
}

export interface CropSuitabilityItem {
  crop: string;
  suitability_score: number;
  confidence: string;
  compatibility_level: "Highly Suitable" | "Suitable" | "Moderate" | "Challenging";
  reasons: string[];
  risks: string[];
  suggestions: string[];
  optimal_season: string;
  expected_duration_days?: number;
  market_potential: string;
}

export interface FarmRiskItem {
  type: "weather" | "soil" | "irrigation" | "crop_health" | "harvest";
  severity: "high" | "medium" | "low";
  title: string;
  reason: string;
  action?: string;
}

export interface FarmRiskSummary {
  overall_risk: "high" | "medium" | "low";
  risk_score: number;
  risks: FarmRiskItem[];
}

export interface FarmRecommendationItem {
  priority: "high" | "medium" | "low";
  category: "irrigation" | "soil" | "weather" | "crop-care" | "harvest" | "monitoring" | "risk";
  title: string;
  reason: string;
  action: string;
  confidence: number;
  urgency: string;
}

export interface FarmActionPlan {
  today: FarmRecommendationItem[];
  this_week: FarmRecommendationItem[];
  routine: FarmRecommendationItem[];
}

export interface ActiveCropIntelligence {
  id: number;
  crop_name: string;
  variety?: string;
  acreage?: number;
  quantity: number;
  growth_stage: string;
  estimated_stage?: string;
  stage_is_estimate: boolean;
  sowing_date?: string;
  expected_harvest_date?: string;
  health_status: string;
  soil_match: string;
  risks: FarmRiskItem[];
  recommendations: FarmRecommendationItem[];
}

export interface FarmIntelligenceOverview {
  farm: {
    farmer_id: number;
    farmer_name: string;
    location: string;
    district: string;
    state: string;
    total_acreage: number;
    preferred_language: string;
    active_crops_count: number;
  };
  weather: WeatherSignals;
  weather_summary: {
    temperature: number;
    humidity: number;
    rain_probability: number;
    condition: string;
    risk_level: string;
    agricultural_advisory: string;
  };
  soil: SoilInterpretation;
  active_crops: ActiveCropIntelligence[];
  risks: FarmRiskSummary;
  recommendations: FarmRecommendationItem[];
  action_plan: FarmActionPlan;
  crop_suitability: CropSuitabilityItem[];
  data_completeness: {
    has_farmer_profile: boolean;
    has_crops: boolean;
    has_soil_profile: boolean;
    soil_ph_available: boolean;
    has_weather: boolean;
    data_quality: string;
    recommendation_notice: string;
  };
  generated_at: string;
}

class FarmIntelligenceApi {
  async getOverview(farmerId: number = 1, location?: string): Promise<FarmIntelligenceOverview> {
    const locParam = location ? `&location=${encodeURIComponent(location)}` : "";
    return apiClient.get<FarmIntelligenceOverview>(`/farm-intelligence/overview?farmer_id=${farmerId}${locParam}`);
  }

  async getRecommendations(farmerId: number = 1): Promise<FarmRecommendationItem[]> {
    return apiClient.get<FarmRecommendationItem[]>(`/farm-intelligence/recommendations?farmer_id=${farmerId}`);
  }

  async getActionPlan(farmerId: number = 1): Promise<FarmActionPlan> {
    return apiClient.get<FarmActionPlan>(`/farm-intelligence/action-plan?farmer_id=${farmerId}`);
  }

  async getRisks(farmerId: number = 1, location: string = ""): Promise<FarmRiskSummary> {
    return apiClient.get<FarmRiskSummary>(`/farm-intelligence/risks?farmer_id=${farmerId}&location=${encodeURIComponent(location)}`);
  }

  async getCropSuitability(farmerId: number = 1, location: string = ""): Promise<CropSuitabilityItem[]> {
    return apiClient.get<CropSuitabilityItem[]>(`/farm-intelligence/crop-suitability?farmer_id=${farmerId}&location=${encodeURIComponent(location)}`);
  }
}

export const farmIntelligenceApi = new FarmIntelligenceApi();
export default farmIntelligenceApi;
