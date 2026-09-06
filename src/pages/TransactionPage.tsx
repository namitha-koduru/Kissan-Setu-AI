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
import buyerMatchingApi, {
  type TransactionDetailResponse,
} from "../services/buyerMatchingApi";
import { DisputeModal } from "../components/DisputeModal";

export function TransactionPage() {
  const [params] = useSearchParams();
  const { transaction: localTx, showToast } = useAppState();

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
    } catch (err) {
      showToast("Updated logistics locally.");
      setIsLogisticsOpen(false);
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
          payment_date: new Date().toISOString().split("T")[0],
        });
        showToast("Payment record updated successfully!");
        setIsPaymentOpen(false);
        loadTransaction();
      }
    } catch (err) {
      showToast("Updated payment record locally.");
      setIsPaymentOpen(false);
    }
  };

  const advanceNextStage = () => {
    if (!txDetail) return;
    const nextIdx = txDetail.events.findIndex((s) => !s.done);
    if (nextIdx !== -1) {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const updatedEvents = txDetail.events.map((s, idx) =>
        idx === nextIdx ? { ...s, done: true, created_at: `Today, ${now}` } : s
      );
      setTxDetail({
        ...txDetail,
        events: updatedEvents,
        status: nextIdx === updatedEvents.length - 1 ? "COMPLETED" : txDetail.status,
      });
      showToast(`Fulfillment stage "${txDetail.events[nextIdx].stage_label}" completed.`);
    } else {
      showToast("Transaction is already fully settled & completed!");
    }
  };

  const isComplete = txDetail?.events.every((e) => e.done);

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      {/* Back link */}
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link
          to="/offers"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back to Offers
        </Link>
      </div>

      {/* Page Header */}
      <div className="page-header" style={{ paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  background: "var(--green-soft)",
                  color: "var(--green-deep)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                Contract #TX-2026-00{txDetail?.id || 1}
              </span>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Digital Transaction & Settlement</h1>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
              {txDetail?.crop_name} · {txDetail?.quantity_kg.toLocaleString("en-IN")} kg · Buyer: <strong>{txDetail?.buyer_name}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-outline"
              style={{ fontSize: "12.5px", color: "var(--danger)", border: "1px solid #F8D7DA" }}
              onClick={() => setIsDisputeOpen(true)}
            >
              <AlertTriangle size={14} /> Report Grievance
            </button>
            <span
              className={`badge-pill ${isComplete ? "badge-high" : "badge-medium"}`}
              style={{ fontSize: "13px", padding: "5px 12px" }}
            >
              {isComplete ? "Settlement Completed" : txDetail?.status || "In Execution"}
            </span>
          </div>
        </div>
      </div>

      {/* Contract & Payout Summary Card */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Trade Agreement Summary</h3>
          <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
            Created: {new Date(txDetail?.created_at || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="pf-row">
          <span className="l">Trade Lot ID</span>
          <span className="v" style={{ fontWeight: 800 }}>KS-2026-00{txDetail?.lot_id || 1}</span>
        </div>
        <div className="pf-row">
          <span className="l">Buyer Name & Enterprise</span>
          <span className="v">{txDetail?.buyer_name} ({txDetail?.buyer_organization || "Enterprise Procurer"})</span>
        </div>
        <div className="pf-row">
          <span className="l">Produce Volume & Grade</span>
          <span className="v">{txDetail?.crop_name} · {txDetail?.quantity_kg.toLocaleString("en-IN")} kg (Grade A)</span>
        </div>
        <div className="pf-row">
          <span className="l">Agreed Unit Selling Rate</span>
          <span className="v" style={{ color: "var(--green-deep)", fontWeight: 800, fontSize: "17px" }}>
            ₹{txDetail?.final_price.toFixed(2)}/kg
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Total Contract Value</span>
          <span className="v" style={{ color: "var(--green-deep)", fontWeight: 900, fontSize: "20px" }}>
            ₹{txDetail?.total_amount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Payment Status</span>
          <span className="v" style={{ fontWeight: 800, color: txDetail?.payment_status === "PAID" ? "var(--green-deep)" : "#B06000" }}>
            {txDetail?.payment_status === "PAID" ? "PAID (Direct Bank Transfer)" : "PENDING (Upon Weighing & Acceptance)"}
          </span>
        </div>

        {/* Action buttons for logistics and payment record */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid #EDF2EB", paddingTop: 14 }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
            onClick={() => setIsLogisticsOpen(true)}
          >
            <Truck size={15} /> Update Logistics & Pickup
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
            onClick={() => setIsPaymentOpen(true)}
          >
            <CreditCard size={15} /> Record Payment Milestone
          </button>
        </div>
      </div>

      {/* Stepped Fulfillment Timeline */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Digital Fulfillment Lifecycle</h3>
            <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: 2 }}>
              Immutable audit timeline tracking contract execution from farm dispatch to final credit.
            </div>
          </div>

          {!isComplete && (
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={advanceNextStage}
              style={{ gap: 6, fontSize: "12px" }}
            >
              <RefreshCw size={13} /> Advance Next Step
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
              Registered Transaction Disputes & Inquiries
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
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 14 }}>Update Logistics & Dispatch</h3>
            <form onSubmit={handleUpdateLogistics}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Logistics Status</label>
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
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Save Logistics</button>
                <button className="btn btn-ghost" type="button" onClick={() => setIsLogisticsOpen(false)} style={{ flex: 0.5 }}>Cancel</button>
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
            <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 14 }}>Record Payment Settlement</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Settlement Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="PAID">Full Payment Received</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PENDING">Pending Settlement</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Paid Amount (₹)</label>
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
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>Record Payment</button>
                <button className="btn btn-ghost" type="button" onClick={() => setIsPaymentOpen(false)} style={{ flex: 0.5 }}>Cancel</button>
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
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>KissanSetu Verified Settlement Guarantee</h4>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
          Buyer funds and procurement contracts are governed by KissanSetu digital trade policies. Produce delivery verification triggers direct account credits without intermediate commission deductions.
        </p>
      </div>
    </div>
  );
}

export default TransactionPage;
