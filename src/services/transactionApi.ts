import apiClient from "./api";
import { initialTransaction } from "../data/demo";
import type { TransactionRecord } from "../types";

export interface TransactionBackendModel {
  id: number;
  lot_id: number;
  final_price: number;
  status: string;
  created_at: string;
}

export const transactionApi = {
  async getTransactions(farmerId?: number): Promise<TransactionRecord[]> {
    try {
      const url = farmerId ? `/transactions?farmer_id=${farmerId}` : "/transactions";
      const data = await apiClient.get<TransactionBackendModel[]>(url);
      if (Array.isArray(data)) {
        return data.map((t) => ({
          id: `tx-2026-${String(t.id).padStart(3, "0")}`,
          lotId: `KS-2026-${String(t.lot_id).padStart(3, "0")}`,
          buyerName: t.lot_id === 2 ? "Reliance Fresh Procurement" : "FreshFarm Foods",
          crop: t.lot_id === 2 ? "Onion" : "Tomato",
          quantityKg: t.lot_id === 2 ? 4000 : 500,
          pricePerKg: t.lot_id === 2 ? 19.5 : 31.0,
          stages: [
            { label: "Lot Created & Verified", done: true, date: "05 Sep, 10:20 AM" },
            { label: "Buyer Offer Received", done: true, date: "05 Sep, 3:40 PM" },
            { label: "Offer Accepted & Locked", done: true, date: "06 Sep, 9:05 AM" },
            { label: "Quality Inspection & Dispatch", done: false, date: "Scheduled: 07 Sep, 8:00 AM" },
            { label: "In-Transit to Hub", done: false, date: "Expected: 07 Sep, 11:30 AM" },
            { label: "Delivery & Settlement", done: false, date: "Expected: 07 Sep, 2:00 PM" },
          ],
        }));
      }
      return farmerId === 1 ? [initialTransaction] : [];
    } catch (error) {
      console.warn("[transactionApi] Backend error fetching transactions:", error);
      return farmerId === 1 ? [initialTransaction] : [];
    }
  },

  async getTransaction(id: number): Promise<TransactionBackendModel> {
    return apiClient.get<TransactionBackendModel>(`/transactions/${id}`);
  },

  async updateTransactionStatus(id: number, status: string): Promise<TransactionBackendModel> {
    return apiClient.put<TransactionBackendModel>(`/transactions/${id}/status`, { status });
  },
};

export default transactionApi;
