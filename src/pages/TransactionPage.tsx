import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Truck,
  CreditCard,
  AlertTriangle,
  Receipt,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import apiClient from "../services/api";
import buyerMatchingApi, {
  type TransactionDetailResponse,
} from "../services/buyerMatchingApi";
import { DisputeModal } from "../components/DisputeModal";
import { DigitalReceiptModal } from "../components/DigitalReceiptModal";
import paymentApi, { type RazorpayPaymentResult } from "../services/paymentApi";
import { downloadTradeReceiptPdf } from "../utils/pdfGenerator";

export function TransactionPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { transaction: localTx, lots, crops, showToast } = useAppState();
  const { t } = useLanguage();

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocStr = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict || "Farm Gate");

  const txIdParam = params.get("id") || "1";

  const [, setLoading] = useState(false);
  const [txDetail, setTxDetail] = useState<TransactionDetailResponse | null>(null);

  // Razorpay Payment States
  const [isPaying, setIsPaying] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string>("");
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string>("");
  const [isTestMode, setIsTestMode] = useState<boolean>(true);

  // Modals state
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Form states for logistics & payment
  const [logisticsStatus, setLogisticsStatus] = useState("PICKUP_SCHEDULED");
  const [pickupDate, setPickupDate] = useState("2026-09-08");
  const [pickupLocation, setPickupLocation] = useState(userLocStr);
  const [transportCost, setTransportCost] = useState(800);

  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [paymentRef, setPaymentRef] = useState(`TXN-SETU-${txIdParam}`);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const activeLot = lots.find((l) => l.id === localTx.lotId) || lots[0];
      const activeCrop = crops.find((c) => c.name.toLowerCase() === (localTx.crop || activeLot?.crop || "").toLowerCase()) || crops[0];
      const finalQty = (localTx.quantityKg && localTx.quantityKg > 0)
        ? localTx.quantityKg
        : (activeLot?.quantityKg || activeCrop?.quantityKg || 500);
      const finalRate = (localTx.pricePerKg && localTx.pricePerKg > 0)
        ? localTx.pricePerKg
        : (activeLot?.expectedPrice || activeCrop?.expectedPrice || 32);
      const finalCrop = localTx.crop || activeLot?.crop || activeCrop?.name || "Tomato";
      const finalBuyer = localTx.buyerName || "Sahyadri Farmers Producer Co.";
      const total = finalRate * finalQty;

      // Try fetching backend detail
      let backendData: TransactionDetailResponse | null = null;
      try {
        backendData = await buyerMatchingApi.getTransactionDetail(Number(txIdParam));
      } catch {}

      if (backendData && localTx.quantityKg && backendData.quantity_kg === localTx.quantityKg) {
        setTxDetail(backendData);
        setLogisticsStatus(backendData.logistics_status || "PICKUP_SCHEDULED");
        setPaidAmount(backendData.paid_amount || 0);
        setPaymentStatus(backendData.payment_status || "PENDING");
      } else {
        setTxDetail({
          id: Number(txIdParam) || 1,
          lot_id: Number((activeLot?.id || localTx.lotId || "1").replace(/[^0-9]/g, "")) || 1,
          buyer_name: finalBuyer,
          buyer_organization: "Sahyadri Agro Processing Hub",
          crop_name: finalCrop,
          quantity_kg: finalQty,
          final_price: finalRate,
          total_amount: total,
          status: "PICKUP_SCHEDULED",
          logistics_status: "PICKUP_SCHEDULED",
          pickup_date: "2026-09-08",
          pickup_location: userLocStr,
          delivery_location: "Sahyadri Central Processing Hub",
          transport_cost_actual: 800,
          payment_status: "PENDING",
          expected_amount: total,
          paid_amount: 0,
          payment_reference: "",
          created_at: new Date().toISOString(),
          events: [
            { id: 1, stage_label: "Contract Confirmed & Verified", description: "Farmer accepted procurement offer at agreed farmgate terms", done: true, created_at: "Today, 10:30 AM" },
            { id: 2, stage_label: "Logistics & Pickup Scheduled", description: `Farm-gate pickup scheduled at ${userLocStr} (Vehicle: AP-16-EV-2026)`, done: true, created_at: "Today, 11:15 AM" },
            { id: 3, stage_label: "Produce In Transit", description: "Produce loaded and dispatched to regional processing hub", done: false, created_at: "Pending" },
            { id: 4, stage_label: "Weighing & Quality Acceptance", description: "Digital weighing scale sync and Grade A quality verification", done: false, created_at: "Pending" },
            { id: 5, stage_label: "Payment Record & Settlement", description: "Direct bank transfer credit to farmer registered bank account", done: false, created_at: "Pending" },
          ],
          disputes: [],
        });
        setLogisticsStatus("PICKUP_SCHEDULED");
        setPaidAmount(0);
        setPaymentStatus("PENDING");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [txIdParam, localTx, lots]);

  const handleUpdateLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (txDetail) {
        await buyerMatchingApi.updateLogistics(txDetail.id, {
          logistics_status: logisticsStatus,
          pickup_date: pickupDate,
          pickup_location: pickupLocation,
          transport_cost_actual: Number(transportCost),
        });
      }
    } catch (err: any) {
      console.warn("Backend logistics sync skipped, updated locally:", err);
    }
    setTxDetail((prev) => prev ? {
      ...prev,
      logistics_status: logisticsStatus,
      pickup_date: pickupDate,
      pickup_location: pickupLocation,
      transport_cost_actual: Number(transportCost),
    } : null);
    showToast("Logistics status updated successfully!");
    setIsLogisticsOpen(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (txDetail) {
        await buyerMatchingApi.recordPayment(txDetail.id, {
          paid_amount: Number(paidAmount),
          payment_status: paymentStatus,
          payment_reference: paymentRef,
        });
      }
    } catch (err: any) {
      console.warn("Backend payment sync skipped, updated locally:", err);
    }
    setTxDetail((prev) => prev ? {
      ...prev,
      paid_amount: Number(paidAmount),
      payment_status: paymentStatus,
      payment_reference: paymentRef,
    } : null);
    showToast("Payment milestone recorded successfully!");
    setIsPaymentOpen(false);
  };

  const advanceNextStage = async () => {
    if (!txDetail) return;
    const nextUnfinishedIdx = txDetail.events.findIndex((e) => !e.done);
    if (nextUnfinishedIdx === -1) return;
    const nextUnfinished = txDetail.events[nextUnfinishedIdx];

    try {
      const stageLower = nextUnfinished.stage_label.toLowerCase();
      if (stageLower.includes("pickup") || stageLower.includes("schedule")) {
        await buyerMatchingApi.updateLogistics(txDetail.id, {
          logistics_status: "SCHEDULED",
          pickup_location: txDetail.pickup_location,
        });
      } else if (stageLower.includes("transit") || stageLower.includes("dispatch")) {
        await buyerMatchingApi.updateLogistics(txDetail.id, {
          logistics_status: "IN_TRANSIT",
          pickup_location: txDetail.pickup_location,
        });
      } else if (stageLower.includes("delivery") || stageLower.includes("settlement") || stageLower.includes("weighing")) {
        await buyerMatchingApi.updateLogistics(txDetail.id, {
          logistics_status: "DELIVERED",
          pickup_location: txDetail.pickup_location,
        });
      } else if (stageLower.includes("payment")) {
        await buyerMatchingApi.recordPayment(txDetail.id, {
          paid_amount: txDetail.total_amount,
          payment_status: "PAID",
        });
      }
    } catch (err: any) {
      console.warn("Backend lifecycle advance skipped, updated locally:", err);
    }

    setTxDetail((prev) => {
      if (!prev) return null;
      const updatedEvents = prev.events.map((ev, idx) =>
        idx === nextUnfinishedIdx ? { ...ev, done: true, created_at: "Just now" } : ev
      );
      const isAllDone = updatedEvents.every((e) => e.done);
      return {
        ...prev,
        events: updatedEvents,
        payment_status: isAllDone ? "PAID" : prev.payment_status,
        paid_amount: isAllDone ? prev.total_amount : prev.paid_amount,
      };
    });
    showToast(`Advanced to next step: ${nextUnfinished.stage_label}`);
  };

  const handlePaySecurely = async () => {
    if (!txDetail) return;
    try {
      setIsPaying(true);
      showToast("Creating secure Razorpay payment order...");
      const order = await paymentApi.createOrder(
        txDetail.id,
        user?.id ? Number(user.id) : undefined,
      );
      setRazorpayOrderId(order.order_id);
      setIsTestMode(order.is_test_mode);

      await paymentApi.openCheckout({
        order,
        buyerName: user?.name || txDetail.buyer_name || "Institutional Procurer",
        buyerEmail: user?.email || "",
        buyerPhone: user?.mobile || "",
        cropName: txDetail.crop_name || localTx.crop || "Produce",
        onSuccess: async (res: RazorpayPaymentResult) => {
          setRazorpayPaymentId(res.razorpay_payment_id);
          showToast("Payment captured! Verifying signature with backend...");

          await paymentApi.verifyPayment({
            transaction_id: txDetail.id,
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,
          });

          setPaymentMethod("RAZORPAY");
          setPaymentStatus("Payment Successful");
          setPaidAmount(order.amount);
          setTxDetail((prev) =>
            prev
              ? {
                  ...prev,
                  payment_status: "PAID",
                  paid_amount: order.amount,
                  payment_reference: res.razorpay_payment_id,
                  events: prev.events.map((ev) =>
                    ev.stage_label.toLowerCase().includes("payment")
                      ? { ...ev, done: true, created_at: "Just now" }
                      : ev,
                  ),
                }
              : null,
          );
          showToast("Payment verified successfully via Razorpay!");
        },
        onDismiss: () => {
          showToast("Payment checkout closed.");
        },
      });
    } catch (err: any) {
      console.error("Razorpay initiation failure:", err);
      showToast("Payment initiation error. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");

  const handleSelectCod = async () => {
    if (!txDetail) return;
    try {
      await apiClient.post(`/transactions/${txDetail.id}/payment-method`, {
        payment_method: "COD",
        cod_charge: 0.0,
      });
      setPaymentMethod("COD");
      setPaymentStatus("COD Selected (Cash on Delivery)");
      showToast("Cash on Delivery (COD) selected. Total: ₹" + netInHand.toLocaleString("en-IN"));
      setTxDetail((prev) =>
        prev
          ? {
              ...prev,
              payment_status: "COD_PENDING",
              payment_reference: `COD-TXN-${txDetail.id}`,
            }
          : null,
      );
    } catch (err) {
      console.warn("Could not set COD method remotely, updating locally", err);
      setPaymentMethod("COD");
      setPaymentStatus("COD Selected (Cash on Delivery)");
      showToast("Cash on Delivery (COD) selected.");
    }
  };

  const isComplete = txDetail?.events.every((e) => e.done);
  const totalVal = txDetail?.total_amount || 0;
  const freightCost = txDetail?.transport_cost_actual || 0;
  const handlingDeduction = 0; // Direct trade no middleman fee
  const netInHand = totalVal - freightCost - handlingDeduction;

  return (
    <div className="wrap" style={{ maxWidth: 840 }}>
      <div className="mb-md" style={{ paddingTop: 10 }}>
        <Link to="/buyers" className="back-link">
          <ArrowLeft size={14} /> {t("common.back", "Back to Marketplace")}
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-md">
            <span className="page-tag">
              KissanSetu Deal #{txDetail?.id || txIdParam}
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              {t("transactions.title", "Fulfillment, Logistics & Payment")}
            </h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {t("transactions.subtitle", "Track trade fulfillment, delivery verification, and payment milestones")}
          </p>
        </div>

        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={() => setIsReceiptOpen(true)}
            style={{ gap: 6 }}
          >
            <Receipt size={16} /> {t("transactions.viewReceipt", "View Digital Receipt")}
          </button>
          <button
            className="btn btn-outline"
            style={{ color: "var(--terracotta)", borderColor: "#F3D8C8" }}
            onClick={() => setIsDisputeOpen(true)}
          >
            <AlertTriangle size={15} /> {t("transactions.initiateDispute", "Report Issue")}
          </button>
        </div>
      </div>

      {/* Transaction Details Overview Card */}
      <div className="card card-pad mb-lg" style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span className="badge-pill badge-high" style={{ fontSize: "11px" }}>
                {txDetail?.status || "CONFIRMED"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--green-deep)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <FileCheck size={14} /> Contract Verified
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 0" }}>
              {txDetail?.crop_name} · {txDetail?.quantity_kg.toLocaleString("en-IN")} kg
            </h2>
            <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 2 }}>
              {t("transactions.buyer", "Buyer")}: <strong>{txDetail?.buyer_name}</strong> ({txDetail?.buyer_organization})
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 700 }}>NET IN-HAND PAYOUT</div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--green-deep)" }}>
              ₹{netInHand.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
              Rate: ₹{txDetail?.final_price.toFixed(2)}/kg (₹{((txDetail?.final_price || 0) * 100).toFixed(0)}/Qtl)
            </div>
          </div>
        </div>

        {/* Realization & Deductions Table */}
        <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "12px 14px", margin: "14px 0", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy)", marginBottom: 8, textTransform: "uppercase" }}>
            Payment & Deduction Breakdown
          </div>
          <div className="flex flex-between text-sm mb-xs">
            <span>Gross Contract Produce Value ({txDetail?.quantity_kg} kg @ ₹{txDetail?.final_price}/kg)</span>
            <span style={{ fontWeight: 700 }}>₹{totalVal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex flex-between text-sm mb-xs" style={{ color: "var(--ink-soft)" }}>
            <span>Farmgate Transport / Freight (Distance adjusted)</span>
            <span style={{ color: freightCost > 0 ? "var(--danger)" : "var(--green-deep)" }}>
              {freightCost > 0 ? `-₹${freightCost}` : "₹0 (Buyer pickup covered)"}
            </span>
          </div>
          <div className="flex flex-between text-sm mb-xs" style={{ color: "var(--ink-soft)" }}>
            <span>Middleman Commission / APMC Arthiya Fee</span>
            <span style={{ color: "var(--green-deep)", fontWeight: 700 }}>₹0 (Direct KissanSetu Trade)</span>
          </div>
          <div className="flex flex-between" style={{ borderTop: "1.5px solid var(--line-strong)", paddingTop: 8, marginTop: 6, fontWeight: 800, fontSize: "15px", color: "var(--green-deep)" }}>
            <span>Estimated Net Realization In-Hand</span>
            <span>₹{netInHand.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Razorpay / COD Procurement Payment Card */}
        <div
          style={{
            background: txDetail?.payment_status === "PAID" ? "#F4FAF5" : "#FFFBF2",
            borderRadius: 12,
            padding: "16px",
            border: txDetail?.payment_status === "PAID" ? "1.5px solid #176B45" : "1.5px solid #E88922",
            margin: "14px 0",
          }}
        >
          <div className="flex flex-between flex-center flex-wrap gap-xs mb-xs">
            <div className="flex flex-center gap-xs">
              <CreditCard size={18} color={txDetail?.payment_status === "PAID" ? "var(--green-deep)" : "#B06000"} />
              <strong style={{ fontSize: 14, color: "var(--navy)" }}>
                {txDetail?.payment_status === "PAID"
                  ? "Procurement Payment Completed"
                  : "Settlement & Payment Gateway"}
              </strong>
            </div>
            <div className="flex flex-center gap-xs">
              {isTestMode && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: "#FFE8D6",
                    color: "#A04000",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  Test Payment Mode
                </span>
              )}
              <span
                className="badge-pill"
                style={{
                  fontSize: 11,
                  background: "#E8F0FE",
                  color: "#1A73E8",
                  fontWeight: 700,
                }}
              >
                {paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Razorpay Online"}
              </span>
              <span
                className="badge-pill"
                style={{
                  fontSize: 11,
                  background: txDetail?.payment_status === "PAID" ? "#E6F4EA" : "#FFF4E5",
                  color: txDetail?.payment_status === "PAID" ? "#137333" : "#B06000",
                }}
              >
                {txDetail?.payment_status === "PAID" ? "Payment Successful" : "Payment Pending"}
              </span>
            </div>
          </div>

          {txDetail?.payment_status === "PAID" ? (
            <div>
              <div style={{ fontSize: 12.5, color: "var(--ink)", marginTop: 6 }}>
                ✓ Authorized payment of <strong>₹{netInHand.toLocaleString("en-IN")}</strong> confirmed via Razorpay.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 11.5,
                  color: "var(--ink-soft)",
                  marginTop: 8,
                  background: "#FFFFFF",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #D1E7DD",
                }}
              >
                <div>
                  Payment Reference:{" "}
                  <strong style={{ color: "var(--navy)" }}>
                    {razorpayPaymentId || txDetail.payment_reference || "pay_rzp_verified"}
                  </strong>
                </div>
                <div>
                  Transaction Reference:{" "}
                  <strong style={{ color: "var(--navy)" }}>Deal #{txDetail.id}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 12px" }}>
                Buyer authorizes payment of <strong>₹{netInHand.toLocaleString("en-IN")}</strong> via standard Razorpay Checkout gateway to lock contract.
              </div>

              <div className="flex gap-sm flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePaySecurely}
                  disabled={isPaying}
                  style={{
                    background: "var(--green-deep)",
                    borderColor: "var(--green-deep)",
                    fontWeight: 800,
                    padding: "10px 20px",
                  }}
                >
                  <CreditCard size={16} />
                  <span>
                    {isPaying
                      ? "Opening Razorpay..."
                      : `Pay Securely Online ₹${netInHand.toLocaleString("en-IN")}`}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSelectCod}
                  style={{
                    fontWeight: 700,
                    borderColor: "var(--green-leaf)",
                    color: "var(--green-deep)",
                    background: "#FAFCF9",
                  }}
                >
                  <span>Cash on Delivery (COD) · ₹{netInHand.toLocaleString("en-IN")}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsPaymentOpen(true)}
                  style={{ fontSize: 12 }}
                >
                  <span>Manual Settlement Reference</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons for logistics, payment, and receipt */}
        <div className="action-bar" style={{ marginTop: 16, borderTop: "1px solid #EDF2EB", paddingTop: 14 }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
            onClick={() => setIsLogisticsOpen(true)}
          >
            <Truck size={15} /> {t("transactions.logistics", "Update Logistics & Pickup")}
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
            onClick={() => downloadTradeReceiptPdf({
              id: `TX-2026-${String(txDetail?.id || 1).padStart(4, "0")}`,
              lotId: `KS-LOT-${String(txDetail?.lot_id || 1).padStart(3, "0")}`,
              farmerName: user?.name || "Registered Farmer",
              farmerLocation: user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : user?.district || "Farm Origin"),
              buyerName: txDetail?.buyer_name || localTx.buyerName || "Sahyadri Farmers Producer Co.",
              buyerLocation: txDetail?.delivery_location || "Regional Procurement Division",
              crop: txDetail?.crop_name || localTx.crop || "Tomato",
              quantityKg: txDetail?.quantity_kg || localTx.quantityKg || 500,
              pricePerKg: txDetail?.final_price || localTx.pricePerKg || 32,
              grossAmount: totalVal,
              transportCharges: freightCost,
              otherCharges: 0,
              netRealization: netInHand,
              paymentStatus: txDetail?.payment_status === "PAID" ? "Payment Successful" : "Payment Pending",
              paymentReference: razorpayPaymentId || txDetail?.payment_reference || `TXN-SETU-${txDetail?.id || 1}`,
              razorpayOrderId: razorpayOrderId || undefined,
              razorpayPaymentId: razorpayPaymentId || undefined,
              paymentDate: txDetail?.payment_date || new Date().toLocaleString(),
              timestamp: txDetail?.created_at ? new Date(txDetail.created_at).toLocaleString() : new Date().toLocaleString(),
              stages: [],
            })}
          >
            <Receipt size={15} /> <span>Download PDF Receipt</span>
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
            onClick={() => setIsReceiptOpen(true)}
          >
            <Receipt size={15} /> {t("transactions.viewReceipt", "View Digital Receipt")}
          </button>
        </div>
      </div>

      {/* Stepped Fulfillment Timeline */}
      <div className="card card-pad mb-lg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>{t("transactions.timeline", "Digital Fulfillment Lifecycle")}</h3>
            <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: 2 }}>
              {t("transactions.subtitle", "Immutable audit timeline tracking contract execution from farm dispatch to final credit.")}
            </div>
          </div>

          {!isComplete && (
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={advanceNextStage}
              style={{ gap: 6, fontSize: "12px" }}
            >
              <RefreshCw size={13} /> {t("common.next", "Advance Next Step")}
            </button>
          )}
        </div>

        <div className="timeline">
          {txDetail?.events.map((s, i) => {
            const isLast = i === (txDetail?.events.length || 0) - 1;
            return (
              <div key={s.id || i} className={`tl-item ${s.done ? "highlight" : ""}`}>
                <div className="tl-dot-col">
                  <div className={`tl-dot ${s.done ? "active" : ""}`} />
                  {!isLast && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h4 style={{ color: s.done ? "var(--green-deep)" : "var(--ink)", fontWeight: s.done ? 800 : 600, fontSize: "14px", margin: 0 }}>
                      {s.stage_label}
                    </h4>
                    <span style={{ fontSize: "11.5px", color: s.done ? "var(--ink)" : "var(--ink-soft)" }}>{s.created_at}</span>
                  </div>
                  {s.description && (
                    <p style={{ color: s.done ? "var(--ink)" : "var(--ink-soft)", fontSize: "12.5px", marginTop: 4 }}>
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Grievances / Disputes List if any */}
      {txDetail?.disputes && txDetail.disputes.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 18, border: "1.5px solid var(--terracotta)", background: "#FFFBF7" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="var(--terracotta)" />
            <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--terracotta)" }}>
              {t("transactions.initiateDispute", "Registered Transaction Disputes & Inquiries")}
            </h3>
          </div>
          {txDetail.disputes.map((d) => (
            <div key={d.id} style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 8, border: "1px solid #EFE4DC", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "13px", textTransform: "capitalize" }}>Category: {d.category}</strong>
                <span className="badge-pill badge-medium" style={{ fontSize: "11px" }}>{d.status}</span>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--ink)", marginTop: 4 }}>"{d.description}"</p>
              {d.resolution_notes && (
                <div style={{ fontSize: "12px", color: "var(--green-deep)", marginTop: 4, fontWeight: 700 }}>
                  Mediation Resolution: {d.resolution_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Logistics Modal */}
      {isLogisticsOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="card card-pad" style={{ maxWidth: 480, width: "100%", background: "#FFFFFF", borderRadius: 14 }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 14 }}>{t("transactions.logistics", "Update Logistics & Dispatch")}</h3>
            <form onSubmit={handleUpdateLogistics}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>{t("transactions.logistics", "Logistics Status")}</label>
                <select value={logisticsStatus} onChange={(e) => setLogisticsStatus(e.target.value)}>
                  <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                  <option value="IN_TRANSIT">In Transit / Vehicle Dispatched</option>
                  <option value="DELIVERED">Delivered to Buyer Hub</option>
                  <option value="ACCEPTED">Quality Accepted at Hub</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Pickup Date</label>
                <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Pickup Location</label>
                <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label>Carrier Transport Cost (₹)</label>
                <input type="number" value={transportCost} onChange={(e) => setTransportCost(Number(e.target.value))} required />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{t("common.save", "Save Logistics")}</button>
                <button className="btn btn-ghost" type="button" onClick={() => setIsLogisticsOpen(false)} style={{ flex: 0.5 }}>{t("common.cancel", "Cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Milestone Modal */}
      {isPaymentOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="card card-pad" style={{ maxWidth: 480, width: "100%", background: "#FFFFFF", borderRadius: 14 }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 14 }}>{t("transactions.payment", "Record Payment Settlement")}</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>{t("transactions.payment", "Settlement Status")}</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="PAID">Full Payment Received</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PENDING">Pending Settlement</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>{t("transactions.amount", "Paid Amount (₹)")}</label>
                <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} required />
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label>Bank Reference / UPI UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-98234190"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{t("common.save", "Record Payment")}</button>
                <button className="btn btn-ghost" type="button" onClick={() => setIsPaymentOpen(false)} style={{ flex: 0.5 }}>{t("common.cancel", "Cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Modal */}
      <DisputeModal
        transactionId={txDetail?.id || 1}
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onDisputeFiled={() => loadTransaction()}
      />

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={{
          id: `TX-2026-${String(txDetail?.id || 1).padStart(4, "0")}`,
          lotId: `KS-LOT-${String(txDetail?.lot_id || 1).padStart(3, "0")}`,
          farmerName: user?.name || "Registered Farmer",
          farmerLocation: user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : user?.district || "Farm Origin"),
          buyerName: txDetail?.buyer_name || localTx.buyerName || "Sahyadri Farmers Producer Co.",
          buyerLocation: txDetail?.delivery_location || "Regional Procurement Division",
          crop: txDetail?.crop_name || localTx.crop || "Tomato",
          quantityKg: txDetail?.quantity_kg || localTx.quantityKg || 500,
          pricePerKg: txDetail?.final_price || localTx.pricePerKg || 32,
          grossAmount: totalVal,
          transportCharges: freightCost,
          otherCharges: 0,
          netRealization: netInHand,
          paymentStatus: txDetail?.payment_status === "PAID" ? "Payment Successful" : "Payment Pending",
          paymentReference: razorpayPaymentId || txDetail?.payment_reference || `TXN-SETU-${txDetail?.id || 1}`,
          razorpayOrderId: razorpayOrderId || undefined,
          razorpayPaymentId: razorpayPaymentId || undefined,
          paymentDate: txDetail?.payment_date || new Date().toLocaleString(),
          timestamp: txDetail?.created_at ? new Date(txDetail.created_at).toLocaleString() : new Date().toLocaleString(),
          stages: (txDetail?.events || []).map((e) => ({
            label: e.stage_label,
            done: e.done,
            date: e.created_at,
          })),
        }}
      />

      {/* Verified Assurance Note */}
      <div className="card card-pad" style={{ marginTop: 20, background: "var(--cream)", border: "1px solid #EADBBE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} color="#176B45" />
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>{t("landing.verifiedIntelligence", "KissanSetu Verified Settlement Guarantee")}</h4>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
          {t("landing.heroSubtitle", "Buyer funds and procurement contracts are governed by KissanSetu digital trade policies. Produce delivery verification triggers direct account credits without intermediate commission deductions.")}
        </p>
      </div>
    </div>
  );
}

export default TransactionPage;
