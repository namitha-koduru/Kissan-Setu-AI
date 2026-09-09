import apiClient from "./api";

export interface PaymentConfig {
  key_id: string;
  test_mode: boolean;
  currency: string;
}

export interface PaymentOrderResponse {
  order_id: string;
  amount_paise: number;
  amount_inr: float;
  currency: string;
  key_id: string;
  transaction_id: number;
  crop_name: string;
  quantity_kg: number;
  final_price: number;
  buyer_name: string;
  farmer_name: string;
  test_mode: boolean;
  notes?: Record<string, any>;
}

export interface PaymentVerifyRequest {
  transaction_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentRecordItem {
  id: number;
  transaction_id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  payment_status: string; // "Payment Pending" | "Payment Processing" | "Payment Successful" | "Payment Failed" | "Payment Refunded"
  amount: number;
  currency: string;
  signature_verified: boolean;
  paid_at?: string | null;
  created_at: string;
  failure_reason?: string | null;
  webhook_status?: string | null;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const paymentService = {
  /**
   * Get public Razorpay configuration (Key ID, Test Mode flag).
   */
  async getConfig(): Promise<PaymentConfig> {
    try {
      return await apiClient.get<PaymentConfig>("/payments/config");
    } catch {
      return {
        key_id: "rzp_test_kisansetu2026",
        test_mode: true,
        currency: "INR",
      };
    }
  },

  /**
   * Request server-authoritative order creation for a verified transaction.
   */
  async createOrder(transactionId: number): Promise<PaymentOrderResponse> {
    return await apiClient.post<PaymentOrderResponse>("/payments/create-order", {
      transaction_id: transactionId,
    });
  },

  /**
   * Submit Razorpay checkout signature for server-side cryptographic verification.
   */
  async verifyPayment(data: PaymentVerifyRequest): Promise<PaymentRecordItem> {
    return await apiClient.post<PaymentRecordItem>("/payments/verify", data);
  },

  /**
   * Retrieve payment status for a specific transaction.
   */
  async getPaymentByTransaction(transactionId: number): Promise<PaymentRecordItem | null> {
    try {
      return await apiClient.get<PaymentRecordItem>(`/payments/${transactionId}`);
    } catch {
      return null;
    }
  },

  /**
   * Dynamically loads the official Razorpay Checkout SDK script if not already present.
   */
  loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay Checkout SDK.");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },
};

export default paymentService;
