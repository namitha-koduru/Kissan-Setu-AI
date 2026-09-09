import { apiClient } from './api';

export interface InventorySummaryItem {
  id: number;
  crop_name: string;
  variety?: string;
  total_quantity: number;
  allocated_quantity: number;
  reserved_quantity: number;
  sold_quantity: number;
  available_quantity: number;
  unit: string;
  quality_grade?: string;
  location?: string;
  updated_at?: string;
}

export interface InventorySummaryResponse {
  farmer_id: number;
  total_stock: number;
  available_to_sell: number;
  in_active_lots: number;
  reserved: number;
  sold: number;
  items_count: number;
  items: InventorySummaryItem[];
}

export interface OfflineSalePayload {
  farmer_id?: number;
  crop_name: string;
  quantity: number;
  unit?: string;
  customer_name?: string;
  notes?: string;
}

export interface AggregationPayload {
  fpo_id?: number;
  crop_name: string;
  quantity: number;
  member_name?: string;
  variety?: string;
  unit?: string;
  notes?: string;
}

export interface StockAuditAdjustment {
  id: number;
  crop_name: string;
  adjustment_type: string;
  quantity: number;
  unit: string;
  customer_name?: string;
  lot_id?: number;
  transaction_id?: number;
  notes?: string;
  created_at: string;
}

export const inventoryApi = {
  getSummary: async (farmerId: number = 1): Promise<InventorySummaryResponse> => {
    return apiClient.get<InventorySummaryResponse>(`/inventory/farmer/${farmerId}`);
  },

  recordOfflineSale: async (payload: OfflineSalePayload): Promise<{ success: boolean; message: string; new_available_quantity: number; sold_quantity: number }> => {
    return apiClient.post('/inventory/offline-sale', payload);
  },

  recordAggregation: async (payload: AggregationPayload): Promise<{ success: boolean; message: string; new_total_quantity: number; new_available_quantity: number }> => {
    return apiClient.post('/inventory/aggregation', payload);
  },

  getAuditHistory: async (farmerId: number = 1, limit: number = 50): Promise<StockAuditAdjustment[]> => {
    return apiClient.get<StockAuditAdjustment[]>(`/inventory/farmer/${farmerId}/audit?limit=${limit}`);
  },
};
