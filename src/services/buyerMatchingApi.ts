import apiClient from "./api";

export interface BuyerMatchFactor {
  factor_name: string;
  score: number;
  max_score: number;
  explanation: string;
  is_positive: boolean;
}

export interface DirectVsMandiComparison {
  crop_name: string;
  quantity_qtl: number;
  quantity_kg: number;
  direct_buyer_name: string;
  direct_offer_price_per_kg: number;
  direct_gross_revenue: number;
  direct_transport_cost: number;
  direct_other_fees: number;
  direct_net_realization: number;
  direct_net_per_kg: number;
  mandi_name: string;
  mandi_price_per_kg: number;
  mandi_gross_revenue: number;
  mandi_transport_cost: number;
  mandi_handling_and_cess: number;
  mandi_net_realization: number;
  mandi_net_per_kg: number;
  net_advantage_total: number;
  net_advantage_per_kg: number;
  recommended_channel: "DIRECT_BUYER" | "APMC_MANDI";
  insight: string;
}

export interface BuyerMatchResult {
  buyer_id: number;
  buyer_name: string;
  organization?: string;
  location: string;
  phone?: string;
  email?: string;
  verified: boolean;
  verification_status: "VERIFIED" | "PENDING" | "UNVERIFIED";
  rating: number;
  business_type: string;
  indicative_price_per_kg: number;
  match_score: number;
  match_level: string;
  reasons: string[];
  warnings: string[];
  comparison?: DirectVsMandiComparison;
  factors: BuyerMatchFactor[];
}

export interface BuyerMatchingResponse {
  crop_name: string;
  quantity_qtl: number;
  quality_grade: string;
  matched_buyers_count: number;
  top_matched_buyer?: string;
  mandi_benchmark_price_per_kg: number;
  buyers: BuyerMatchResult[];
}

export interface OfferHistoryItem {
  id: number;
  offered_price: number;
  counter_price?: number;
  quantity_kg?: number;
  sender_role: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface OfferIntelligenceResponse {
  offer_id: number;
  lot_id: number;
  buyer_id: number;
  buyer_name: string;
  organization?: string;
  is_verified: boolean;
  verification_status: string;
  offered_price: number;
  mandi_benchmark_price: number;
  price_premium_per_kg: number;
  quantity_kg: number;
  estimated_net_realization_total: number;
  mandi_net_realization_total: number;
  net_advantage_total: number;
  match_score: number;
  relative_attractiveness: string;
  suggested_counter_min: number;
  suggested_counter_max: number;
  negotiation_tip: string;
  history: OfferHistoryItem[];
}

export interface TransactionEventResponse {
  id: number;
  stage_label: string;
  description?: string;
  done: boolean;
  created_at: string;
}

export interface DisputeResponse {
  id: number;
  transaction_id: number;
  raised_by_role: string;
  raised_by_id?: number;
  category: string;
  description: string;
  status: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface TransactionDetailResponse {
  id: number;
  lot_id: number;
  farmer_id?: number;
  buyer_id?: number;
  buyer_name?: string;
  buyer_organization?: string;
  crop_name?: string;
  quantity_kg: number;
  final_price: number;
  total_amount: number;
  status: string;
  logistics_status: string;
  pickup_date?: string;
  pickup_location?: string;
  delivery_location?: string;
  transport_cost_actual?: number;
  payment_status: string;
  expected_amount?: number;
  paid_amount: number;
  payment_date?: string;
  payment_reference?: string;
  created_at: string;
  updated_at?: string;
  events: TransactionEventResponse[];
  disputes: DisputeResponse[];
}

class BuyerMatchingApi {
  async getRecommendedBuyers(
    cropName: string = "Tomato",
    quantityQtl: number = 20.0,
    qualityGrade: string = "Grade A",
    location: string = "Nashik, Maharashtra",
    verifiedOnly: boolean = false
  ): Promise<BuyerMatchingResponse> {
    return apiClient.get<BuyerMatchingResponse>(
      `/buyers/recommended?crop_name=${encodeURIComponent(cropName)}&quantity_qtl=${quantityQtl}&quality_grade=${encodeURIComponent(qualityGrade)}&location=${encodeURIComponent(location)}&verified_only=${verifiedOnly}`
    );
  }

  async getBuyerMatchDetail(
    buyerId: number,
    cropName: string = "Tomato",
    quantityQtl: number = 20.0
  ): Promise<BuyerMatchResult> {
    return apiClient.get<BuyerMatchResult>(
      `/buyers/${buyerId}/match?crop_name=${encodeURIComponent(cropName)}&quantity_qtl=${quantityQtl}`
    );
  }

  async getOfferIntelligence(offerId: number): Promise<OfferIntelligenceResponse> {
    return apiClient.get<OfferIntelligenceResponse>(`/offers/${offerId}/intelligence`);
  }

  async getOfferHistory(offerId: number): Promise<OfferHistoryItem[]> {
    return apiClient.get<OfferHistoryItem[]>(`/offers/${offerId}/history`);
  }

  async counterOffer(offerId: number, counterPrice: number, message?: string, quantityKg?: number) {
    return apiClient.post(`/offers/${offerId}/counter`, {
      counter_price: counterPrice,
      message,
      quantity_kg: quantityKg,
    });
  }

  async acceptOffer(offerId: number) {
    return apiClient.post(`/offers/${offerId}/accept`);
  }

  async rejectOffer(offerId: number) {
    return apiClient.post(`/offers/${offerId}/reject`);
  }

  async getTransactionDetail(transactionId: number): Promise<TransactionDetailResponse> {
    return apiClient.get<TransactionDetailResponse>(`/transactions/${transactionId}/detail`);
  }

  async updateLogistics(
    transactionId: number,
    data: {
      logistics_status: string;
      pickup_date?: string;
      pickup_location?: string;
      delivery_location?: string;
      transport_cost_actual?: number;
    }
  ): Promise<TransactionDetailResponse> {
    return apiClient.post<TransactionDetailResponse>(`/transactions/${transactionId}/logistics`, data);
  }

  async recordPayment(
    transactionId: number,
    data: {
      paid_amount: number;
      payment_status: string;
      payment_date?: string;
      payment_reference?: string;
    }
  ): Promise<TransactionDetailResponse> {
    return apiClient.put<TransactionDetailResponse>(`/transactions/${transactionId}/payment`, data);
  }

  async fileDispute(
    transactionId: number,
    data: {
      category: string;
      description: string;
      raised_by_role?: string;
    }
  ): Promise<DisputeResponse> {
    return apiClient.post<DisputeResponse>(`/transactions/${transactionId}/dispute`, data);
  }

  async resolveDispute(
    disputeId: number,
    data: {
      status: string;
      resolution_notes: string;
    }
  ): Promise<DisputeResponse> {
    return apiClient.put<DisputeResponse>(`/transactions/disputes/${disputeId}/resolve`, data);
  }
}

export const buyerMatchingApi = new BuyerMatchingApi();
export default buyerMatchingApi;
