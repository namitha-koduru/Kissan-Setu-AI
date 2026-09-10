/**
 * Razorpay Payment API Client & Standard Checkout Integration for KissanSetuAI.
 * Securely communicates with backend payment endpoints and initiates Razorpay Checkout.
 */

import apiClient from "./api";

export interface CreateOrderResponse {
  order_id: string;
  key_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  transaction_id: number;
  is_test_mode: boolean;
  receipt: string;
}

export interface VerifyPaymentPayload {
  transaction_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentAuditRecord {
  payment_id?: number;
  transaction_id: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_status: string;
  amount: number;
  currency: string;
  created_at?: string;
  paid_at?: string;
  signature_verified: boolean;
  webhook_status: string;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load official Razorpay SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export const paymentApi = {
  /**
   * Request server-authoritative Razorpay Order creation.
   */
  async createOrder(transactionId: number, buyerId?: number, userRole?: string): Promise<CreateOrderResponse> {
    const headers: Record<string, string> = {};
    if (userRole) {
      headers["X-User-Role"] = userRole;
    }
    if (buyerId) {
      headers["X-User-Id"] = String(buyerId);
    }
    return await apiClient.post<CreateOrderResponse>(
      "/payments/create-order",
      {
        transaction_id: transactionId,
        buyer_id: buyerId,
      },
      headers
    );
  },

  /**
   * Send signature verification to backend.
   */
  async verifyPayment(data: VerifyPaymentPayload): Promise<any> {
    return await apiClient.post("/payments/verify", data);
  },

  /**
   * Fetch payment audit records for a transaction.
   */
  async getPayments(transactionId: number): Promise<PaymentAuditRecord[]> {
    try {
      return await apiClient.get<PaymentAuditRecord[]>(`/payments/${transactionId}`);
    } catch (err) {
      console.warn("Failed to fetch payments audit for transaction:", err);
      return [];
    }
  },

  /**
   * Opens Razorpay Standard Checkout modal with complete handlers.
   */
  async openCheckout(options: {
    order: CreateOrderResponse;
    buyerName: string;
    buyerEmail?: string;
    buyerPhone?: string;
    cropName: string;
    onSuccess: (res: RazorpayPaymentResult) => void;
    onError?: (err: any) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    const isLoaded = await loadRazorpayScript();
    if (isLoaded && (window as any).Razorpay && options.order.key_id) {
      const rzpOptions = {
        key: options.order.key_id,
        amount: options.order.amount_paise,
        currency: options.order.currency || "INR",
        name: "KissanSetuAI",
        description: `Procurement Payment for ${options.cropName}`,
        image: "https://kissan-setu-ai.vercel.app/logo.png",
        order_id: options.order.order_id,
        prefill: {
          name: options.buyerName,
          email: options.buyerEmail || "",
          contact: options.buyerPhone || "",
        },
        theme: {
          color: "#176B45",
        },
        notes: {
          transaction_id: String(options.order.transaction_id),
          environment: options.order.is_test_mode ? "Test Mode" : "Production",
        },
        handler: (response: RazorpayPaymentResult) => {
          options.onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            if (options.onDismiss) options.onDismiss();
          },
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      if (options.onError) {
        rzp.on("payment.failed", (response: any) => {
          options.onError?.(response.error || response);
        });
      }
      rzp.open();
      return;
    }

    if (options.onError) {
      options.onError({
        description: "Razorpay Checkout SDK failed to load. Please check your internet connection.",
      });
    }
  },
};

export default paymentApi;
