import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Truck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import buyerMatchingApi, {
  type TransactionDetailResponse,
} from "../services/buyerMatchingApi";
import { DisputeModal } from "../components/DisputeModal";

export function TransactionPage() {
  const [params] = useSearchParams();
  const { transaction: localTx, showToast } = useAppState();
  const { t } = useLanguage();

  const txIdParam = params.get("id") || "1";

  const [, setLoading] = useState(false);
  const [txDetail, setTxDetail] = useState<TransactionDetailResponse | null>(null);

  // Modals state
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Form states for logistics & payment
  const [logisticsStatus, setLogisticsStatus] = useState("PICKUP_SCHEDULED");
  const [pickupDate, setPickupDate] = useState("2026-09-08");
  const [pickupLocation, setPickupLocation] = useState("Nashik Farm Gate");
  const [transportCost, setTransportCost] = useState(800);

  const [paidAmount, setPaidAmount] = useState(72000);
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [paymentRef, setPaymentRef] = useState("UTR-HDFC-98234190");

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await buyerMatchingApi.getTransactionDetail(Number(txIdParam));
      setTxDetail(data);
      setLogisticsStatus(data.logistics_status || "PICKUP_SCHEDULED");
      setPaidAmount(data.paid_amount || data.total_amount);
      setPaymentStatus(data.payment_status || "PENDING");
    } catch (err) {
      console.warn("Falling back to local transaction state", err);
      // Construct fallback
      setTxDetail({
        id: Number(txIdParam) || 1,
        lot_id: 1,
        buyer_name: localTx.buyerName || "Sahyadri Farmer Producer Co.",
        buyer_organization: "Sahyadri Agro Processing",
        crop_name: localTx.crop || "Tomato",
        quantity_kg: localTx.quantityKg || 2500,
        final_price: localTx.pricePerKg || 32,
        total_amount: (localTx.pricePerKg || 32) * (localTx.quantityKg || 2500),
        status: "PICKUP_SCHEDULED",
        logistics_status: "PICKUP_SCHEDULED",
        pickup_date: "2026-09-08",
        pickup_location: "Nashik, Maharashtra",
        delivery_location: "Sahyadri Central Hub, Mohadi",
        transport_cost_actual: 800,
        payment_status: "PENDING",
        expected_amount: (localTx.pricePerKg || 32) * (localTx.quantityKg || 2500),
        paid_amount: 0,
        payment_reference: "",
        created_at: new Date().toISOString(),
        events: [
          { id: 1, stage_label: "Contract Confirmed & Verified", description: "Farmer Ramesh accepted procurement tender from Sahyadri FPO", done: true, created_at: "Today, 10:30 AM" },
          { id: 2, stage_label: "Logistics & Pickup Scheduled", description: "Farm-gate pickup scheduled for 08 Sep 2026 (Vehicle: MH-15-EV-4021)", done: true, created_at: "Today, 11:15 AM" },
          { id: 3, stage_label: "Produce In Transit", description: "Produce loaded and dispatched to processing unit", done: false, created_at: "Pending" },
          { id: 4, stage_label: "Weighing & Quality Acceptance", description: "Digital weighing scale sync and Grade A confirmation", done: false, created_at: "Pending" },
          { id: 5, stage_label: "Payment Record & Settlement", description: "Direct bank transfer credit to farmer HDFC account", done: false, created_at: "Pending" },
        ],
        disputes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [txIdParam]);

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
        showToast("Logistics status updated successfully!");
        setIsLogisticsOpen(false);
        loadTransaction();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update logistics");
    }
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
        showToast("Payment milestone recorded successfully!");
        setIsPaymentOpen(false);
        loadTransaction();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to record payment");
    }
  };

  const advanceNextStage = async () => {
    if (!txDetail) return;
    const nextUnfinished = txDetail.events.find((e) => !e.done);
    if (!nextUnfinished) return;

    try {
      await buyerMatchingApi.advanceTransactionStage(txDetail.id, {
        stage_id: nextUnfinished.id,
        stage_label: nextUnfinished.stage_label,
        description: `Stage completed at ${new Date().toLocaleTimeString()}`,
      });
      showToast(`Advanced to next step: ${nextUnfinished.stage_label}`);
      loadTransaction();
    } catch (err: any) {
      showToast(err.message || "Could not advance lifecycle step");
    }
  };

  const isComplete = txDetail?.events.every((e) => e.done);

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
              KissanSetu Trade
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              {t("transactions.title", "Digital Transactions & Logistics")} #{txDetail?.id || txIdParam}
            </h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {t("transactions.subtitle", "Track trade fulfillment, delivery verification, and payment milestones")}
          </p>
        </div>

        <div className="action-bar">
          <button
            className="btn btn-outline"
            style={{ color: "var(--terracotta)", borderColor: "#F3D8C8" }}
            onClick={() => setIsDisputeOpen(true)}
          >
            <AlertTriangle size={15} /> {t("transactions.initiateDispute", "Report Issue / Dispute")}
          </button>
        </div>
      </div>

      {/* Transaction Details Overview Card */}
      <div className="card card-pad mb-lg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <span className="badge-pill badge-high" style={{ fontSize: "11px", marginBottom: 6 }}>
              {txDetail?.status || "CONFIRMED"}
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0" }}>
              {txDetail?.crop_name} · {txDetail?.quantity_kg.toLocaleString()} kg
            </h2>
            <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 2 }}>
              {t("transactions.buyer", "Buyer")}: <strong>{txDetail?.buyer_name}</strong> ({txDetail?.buyer_organization})
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>{t("transactions.amount", "Total Contract Value")}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--green-deep)" }}>
              ₹{txDetail?.total_amount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="pf-row">
          <span className="l">{t("market.grossPrice", "Contracted Agreed Price")}</span>
          <span className="v" style={{ fontWeight: 800 }}>
            ₹{txDetail?.final_price.toFixed(2)}/kg
          </span>
        </div>
        <div className="pf-row">
          <span className="l">{t("transactions.amount", "Total Contract Value")}</span>
          <span className="v" style={{ color: "var(--green-deep)", fontWeight: 900, fontSize: "20px" }}>
            ₹{txDetail?.total_amount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="pf-row">
          <span className="l">{t("transactions.payment", "Payment Status")}</span>
          <span className="v" style={{ fontWeight: 800, color: txDetail?.payment_status === "PAID" ? "var(--green-deep)" : "#B06000" }}>
            {txDetail?.payment_status === "PAID" ? "PAID (Direct Bank Transfer)" : "PENDING (Upon Weighing & Acceptance)"}
          </span>
        </div>

        {/* Action buttons for logistics and payment record */}
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
            onClick={() => setIsPaymentOpen(true)}
          >
            <CreditCard size={15} /> {t("transactions.payment", "Record Payment Milestone")}
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
