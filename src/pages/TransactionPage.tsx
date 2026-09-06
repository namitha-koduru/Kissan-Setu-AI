import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { useAppState } from "../context/AppStateContext";

export function TransactionPage() {
  const { transaction, showToast } = useAppState();

  const [stages, setStages] = useState(transaction.stages);

  const advanceNextStage = () => {
    const nextIdx = stages.findIndex((s) => !s.done);
    if (nextIdx !== -1) {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const updated = stages.map((s, idx) =>
        idx === nextIdx ? { ...s, done: true, date: `Today, ${now}` } : s,
      );
      setStages(updated);
      showToast(`Stage updated: "${stages[nextIdx].label}" marked as completed.`);
    } else {
      showToast("Transaction already fully completed & settled!");
    }
  };

  const isComplete = stages.every((s) => s.done);

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link to="/offers" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Offers
        </Link>
      </div>

      <div className="page-header" style={{ paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Transaction & Settlement Tracking</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
              {transaction.crop} · {transaction.quantityKg} kg · Buyer: <strong>{transaction.buyerName}</strong> · Settled at <strong>₹{transaction.pricePerKg}/kg</strong>
            </p>
          </div>
          <span className={`badge-pill ${isComplete ? "badge-high" : "badge-medium"}`} style={{ fontSize: "13px", padding: "5px 12px" }}>
            {isComplete ? "Settlement Completed" : "Order in Execution"}
          </span>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="pf-row">
          <span className="l">Trade Lot Identifier</span>
          <span className="v">{transaction.lotId}</span>
        </div>
        <div className="pf-row">
          <span className="l">Procuring Buyer</span>
          <span className="v">{transaction.buyerName}</span>
        </div>
        <div className="pf-row">
          <span className="l">Produce Volume & Quality</span>
          <span className="v">{transaction.crop} ({transaction.quantityKg} kg, Grade A)</span>
        </div>
        <div className="pf-row">
          <span className="l">Agreed Final Selling Rate</span>
          <span className="v" style={{ color: "var(--green-deep)", fontWeight: 800, fontSize: "17px" }}>
            ₹{transaction.pricePerKg}/kg
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Total Payout Amount</span>
          <span className="v" style={{ color: "var(--green-deep)", fontWeight: 800, fontSize: "18px" }}>
            ₹{(transaction.pricePerKg * transaction.quantityKg).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Direct Payout Channel</span>
          <span className="v">KisanSetu Escrow → Bank Account (HDFC **4921)</span>
        </div>
      </div>

      {/* Stepped Timeline */}
      <div className="card card-pad">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Fulfillment Timeline</h3>
          {!isComplete && (
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={advanceNextStage}
              style={{ gap: 6 }}
            >
              <RefreshCw size={13} /> Simulate Next Fulfillment Step
            </button>
          )}
        </div>

        <div className="timeline">
          {stages.map((s, i) => {
            const isLast = i === stages.length - 1;
            return (
              <div key={s.label} className={`tl-item ${s.done ? "highlight" : ""}`}>
                <div className="tl-dot-col">
                  <div className={`tl-dot ${s.done ? "active" : ""}`} />
                  {!isLast && <div className="tl-line" />}
                </div>
                <div className="tl-content">
                  <h4 style={{ color: s.done ? "var(--green-deep)" : "var(--ink)", fontWeight: s.done ? 800 : 600 }}>
                    {s.label}
                  </h4>
                  <p style={{ color: s.done ? "var(--ink)" : "var(--ink-soft)" }}>{s.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 20, background: "var(--cream)", border: "1px solid #EADBBE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} color="#176B45" />
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>Guaranteed Direct Settlement</h4>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6 }}>
          Funds are locked in verified escrow when the buyer tender is accepted. Delivery confirmation triggers instant digital credit with 0% commission deduction.
        </p>
      </div>
    </div>
  );
}
