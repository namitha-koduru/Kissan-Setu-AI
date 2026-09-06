import apiClient from "./api";

export interface PricePointData {
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  mandi_name?: string;
}

export interface PriceAnalyticsResponse {
  crop_name: string;
  mandi_name: string;
  current_modal_price: number;
  price_unit: string;
  avg_7d: number;
  avg_30d: number;
  avg_90d: number;
  trend_direction: "UPWARD" | "DOWNWARD" | "STABLE";
  trend_percentage_7d: number;
  volatility_score: number;
  volatility_level: "LOW" | "MODERATE" | "HIGH";
  history_points: PricePointData[];
}

export interface PriceForecastPoint {
  date: string;
  day_offset: number;
  expected_price: number;
  min_expected: number;
  max_expected: number;
  confidence_score: number;
}

export interface PriceForecastResponse {
  crop_name: string;
  baseline_price: number;
  forecast_horizon_days: number;
  trend_direction: string;
  forecast_points: PriceForecastPoint[];
  key_drivers: string[];
  limitations_disclaimer: string;
}

export interface NetRealizationBreakdown {
  crop_name: string;
  mandi_id: number;
  mandi_name: string;
  distance_km: number;
  quantity_quintals: number;
  quantity_kg: number;
  gross_price_per_quintal: number;
  gross_price_per_kg: number;
  gross_revenue: number;
  transport_cost_total: number;
  transport_cost_per_kg: number;
  handling_cost_total: number;
  handling_cost_per_kg: number;
  mandi_fee_total: number;
  mandi_fee_per_kg: number;
  storage_cost_total: number;
  storage_cost_per_kg: number;
  expected_handling_loss_kg: number;
  net_realization_total: number;
  net_realization_per_quintal: number;
  net_realization_per_kg: number;
  margin_percentage: number;
}

export interface MarketComparisonItem {
  mandi_id: number;
  mandi_name: string;
  location: string;
  distance_km: number;
  gross_price_per_quintal: number;
  gross_price_per_kg: number;
  transport_cost_per_kg: number;
  handling_and_fees_per_kg: number;
  net_realization_per_kg: number;
  net_realization_total: number;
  is_best_net: boolean;
  is_highest_gross: boolean;
  advantage_vs_local_total: number;
  arrival_volume: string;
  demand_level: "Low" | "Medium" | "High";
}

export interface MultiMarketComparisonResponse {
  crop_name: string;
  quantity_quintals: number;
  best_mandi_name: string;
  best_net_per_kg: number;
  highest_gross_mandi_name: string;
  highest_gross_price_per_kg: number;
  net_vs_gross_insight: string;
  markets: MarketComparisonItem[];
}

export interface SellingDecisionResponse {
  crop_name: string;
  recommendation: "SELL" | "WAIT" | "COMPARE";
  confidence_score: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  recommended_mandi: string;
  expected_net_per_kg: number;
  expected_gross_per_kg: number;
  decision_score: number;
  top_reasons: string[];
  weather_factor: string;
  price_trend_factor: string;
  storage_viability: string;
  action_summary: string;
}

export interface BuyerOpportunityItem {
  buyer_id: number;
  buyer_name: string;
  company_name?: string;
  is_verified: boolean;
  rating: number;
  crop_name: string;
  quality_grade: string;
  quantity_required_quintals: number;
  offered_price_per_quintal: number;
  offered_price_per_kg: number;
  location: string;
  distance_km: number;
  net_advantage_per_kg: number;
  estimated_net_realization_total: number;
  payment_terms: string;
  deadline_days: number;
}

export interface BuyerOpportunitiesResponse {
  crop_name: string;
  opportunities_count: number;
  best_direct_buyer_name?: string;
  best_offered_net_per_kg?: number;
  direct_vs_mandi_premium_per_kg: number;
  opportunities: BuyerOpportunityItem[];
}

export interface MarketIntelligenceOverview {
  crop_name: string;
  quantity_quintals: number;
  analytics: PriceAnalyticsResponse;
  forecast: PriceForecastResponse;
  comparison: MultiMarketComparisonResponse;
  decision: SellingDecisionResponse;
  buyer_opportunities: BuyerOpportunitiesResponse;
  generated_at: string;
}

export interface NetRealizationRequest {
  crop_name: string;
  quantity_quintals: number;
  gross_price_per_quintal: number;
  distance_km: number;
  transport_rate_per_km_quintal?: number;
  handling_cost_per_quintal?: number;
  mandi_fee_percent?: number;
  storage_days?: number;
  storage_cost_per_day_quintal?: number;
  loss_percentage?: number;
}

class MarketIntelligenceApi {
  async getOverview(cropName: string = "Tomato", quantityQuintals: number = 30): Promise<MarketIntelligenceOverview> {
    return apiClient.get<MarketIntelligenceOverview>(
      `/market-intelligence/overview?crop_name=${encodeURIComponent(cropName)}&quantity_quintals=${quantityQuintals}`
    );
  }

  async getPriceTrends(cropName: string = "Tomato", days: number = 30): Promise<PriceAnalyticsResponse> {
    return apiClient.get<PriceAnalyticsResponse>(
      `/market-intelligence/trends?crop_name=${encodeURIComponent(cropName)}&days=${days}`
    );
  }

  async getPriceForecast(cropName: string = "Tomato", daysAhead: number = 7): Promise<PriceForecastResponse> {
    return apiClient.get<PriceForecastResponse>(
      `/market-intelligence/forecast?crop_name=${encodeURIComponent(cropName)}&days_ahead=${daysAhead}`
    );
  }

  async compareMarkets(
    cropName: string = "Tomato",
    quantityQuintals: number = 30,
    targetDistanceKm: number = 40,
    includeStorageDays: number = 0
  ): Promise<MultiMarketComparisonResponse> {
    return apiClient.get<MultiMarketComparisonResponse>(
      `/market-intelligence/compare?crop_name=${encodeURIComponent(cropName)}&quantity_quintals=${quantityQuintals}&target_distance_km=${targetDistanceKm}&include_storage_days=${includeStorageDays}`
    );
  }

  async getSellingDecision(
    cropName: string = "Tomato",
    quantityQuintals: number = 30,
    targetDistanceKm: number = 40,
    qualityGrade: string = "Grade A"
  ): Promise<SellingDecisionResponse> {
    return apiClient.get<SellingDecisionResponse>(
      `/market-intelligence/decision?crop_name=${encodeURIComponent(cropName)}&quantity_quintals=${quantityQuintals}&target_distance_km=${targetDistanceKm}&quality_grade=${encodeURIComponent(qualityGrade)}`
    );
  }

  async getBuyerOpportunities(
    cropName: string = "Tomato",
    minQuantity: number = 10
  ): Promise<BuyerOpportunitiesResponse> {
    return apiClient.get<BuyerOpportunitiesResponse>(
      `/market-intelligence/buyer-opportunities?crop_name=${encodeURIComponent(cropName)}&min_quantity=${minQuantity}`
    );
  }

  async calculateNetRealization(calcRequest: NetRealizationRequest): Promise<NetRealizationBreakdown> {
    return apiClient.post<NetRealizationBreakdown>("/market-intelligence/calculate-net", calcRequest);
  }
}

export const marketIntelligenceApi = new MarketIntelligenceApi();
export default marketIntelligenceApi;
