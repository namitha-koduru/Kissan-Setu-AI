import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  History,
} from "lucide-react";
import buyerMatchingApi from "../services/buyerMatchingApi";
import type {
  OfferIntelligenceResponse,
  OfferHistoryItem,
} from "../services/buyerMatchingApi";
import type { OfferRecord } from "../types";

interface Props {
  offer: OfferRecord;
  onOfferUpdated?: () => void;
}

export function OfferIntelligenceCard({ offer, onOfferUpdated }: Props) {
  const navigate = useNavigate();
  const [intel, setIntel] = useState<OfferIntelligenceResponse | null>(null);
  const [history, setHistory] = useState<OfferHistoryItem[]>([]);
  const [, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Counter State
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number>(offer.pricePerKg + 1.0);
  const [counterMessage, setCounterMessage] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Fetch offer intelligence from backend
  const loadIntelligence = async () => {
    try {
      const numericId = parseInt(offer.id.replace(/\D/g, "")) || 1;
      setLoading(true);
      const data = await buyerMatchingApi.getOfferIntelligence(numericId);
      setIntel(data);
      setCounterPrice(data.suggested_counter_min || offer.pricePerKg + 0.5);
      const histData = await buyerMatchingApi.getOfferHistory(numericId);
      setHistory(histData);
    } catch (err) {
      console.warn("Could not fetch remote offer intelligence, using client fallback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, [offer.id]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const numericId = parseInt(offer.id.replace(/\D/g, "")) || 1;
      await buyerMatchingApi.acceptOffer(numericId);
      if (onOfferUpdated) onOfferUpdated();
      navigate(`/transactions?lot=${offer.lotId}`);
    } catch (err) {
      console.error("Failed to accept offer", err);
      // Fallback navigation
      navigate(`/transactions?lot=${offer.lotId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const numericId = parseInt(offer.id.replace(/\D/g, "")) || 1;
      await buyerMatchingApi.rejectOffer(numericId);
      if (onOfferUpdated) onOfferUpdated();
    } catch (err) {
      console.error("Failed to reject offer", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCounter = async () => {
    try {
      setActionLoading(true);
      const numericId = parseInt(offer.id.replace(/\D/g, "")) || 1;
      await buyerMatchingApi.counterOffer(numericId, counterPrice, counterMessage, offer.quantityKg);
      setShowCounter(false);
      loadIntelligence();
      if (onOfferUpdated) onOfferUpdated();
    } catch (err) {
      console.error("Failed to submit counter", err);
      setShowCounter(false);
    } finally {
      setActionLoading(false);
    }
  };

  const isAccepted = offer.status === "Accepted";
  const isRejected = offer.status === "Rejected";
  const isCountered = offer.status === "Countered";

  return (
    <div
      className="card card-pad"
      style={{
        background: "#FFFFFF",
        border: isAccepted ? "2px solid #176B45" : isCountered ? "1.5px solid #E88922" : "1px solid var(--line)",
        borderRadius: "14px",
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>{offer.buyerName}</h3>
            {offer.verified && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#137333",
                  background: "#E6F4EA",
                  padding: "2px 6px",
                  borderRadius: 8,
                }}
              >
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 12,
                backgroundColor: isAccepted ? "#E6F4EA" : isRejected ? "#FCE8E6" : isCountered ? "#FFF4E5" : "#E8F0FE",
                color: isAccepted ? "#137333" : isRejected ? "#C5221F" : isCountered ? "#B06000" : "#1A73E8",
              }}
            >
              {offer.status.toUpperCase()}
            </span>
          </div>

          <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: 2 }}>
            Quantity Tender: <strong>{offer.quantityKg.toLocaleString("en-IN")} kg</strong> ({offer.quality || "Grade A"}) · Expires in: {offer.expiresInDays}
          </div>
        </div>

        {/* Pricing Block */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>OFFERED RATE</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--green-deep)" }}>
            ₹{offer.pricePerKg.toFixed(2)}
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>/kg</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
            Total Value: ₹{(offer.pricePerKg * offer.quantityKg).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Intelligence Insight Banner */}
      {intel && (
        <div
          style={{
            background: "#F4FAF5",
            border: "1px solid #D1E7DD",
            borderRadius: "8px",
            padding: "10px 14px",
            margin: "10px 0 14px",
            fontSize: "12.5px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontWeight: 800, color: "var(--green-deep)", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={14} /> AI Offer Evaluation
            </span>
            <span style={{ fontSize: "11.5px", color: "#137333", fontWeight: 800 }}>
              {intel.price_premium_per_kg >= 0 ? `+₹${intel.price_premium_per_kg.toFixed(2)}/kg vs Mandi` : `-₹${Math.abs(intel.price_premium_per_kg).toFixed(2)}/kg vs Mandi`}
            </span>
          </div>
          <div style={{ color: "var(--ink-mid)" }}>{intel.negotiation_tip}</div>

          {intel.net_advantage_total > 0 && (
            <div style={{ marginTop: 6, fontWeight: 700, color: "#137333" }}>
              ✓ Direct net realization advantage: +₹{intel.net_advantage_total.toLocaleString("en-IN")} higher in-hand return than APMC Mandi.
            </div>
          )}
        </div>
      )}

      {/* Counter Form */}
      {showCounter && (
        <div
          style={{
            background: "#FFFBF2",
            border: "1.5px solid var(--saffron)",
            borderRadius: "10px",
            padding: "14px",
            margin: "12px 0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: "14px", color: "#8B4700" }}>AI-Assisted Negotiation Counter</strong>
            {intel && (
              <span style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>
                Suggested Range: <strong>₹{intel.suggested_counter_min.toFixed(2)} – ₹{intel.suggested_counter_max.toFixed(2)}/kg</strong>
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                Your Counter Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.25"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--line-strong)", fontWeight: 800 }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, display: "block", marginBottom: 4 }}>
                Message to Buyer (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Can do farm gate pickup on Friday at ₹29.50/kg"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--line-strong)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSendCounter}
              disabled={actionLoading}
            >
              {actionLoading ? "Submitting..." : "Send Counter Offer"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowCounter(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* History Modal / Drawer */}
      {showHistoryModal && (
        <div
          style={{
            background: "#F8FAF7",
            border: "1px solid #E2E8DE",
            borderRadius: "8px",
            padding: "12px",
            margin: "10px 0",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Negotiation Audit Thread</strong>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHistoryModal(false)} style={{ padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          {history.length === 0 ? (
            <div>No counter history recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E0E0E0", paddingBottom: 4 }}>
                  <span>
                    <strong>{h.sender_role}:</strong> {h.status} at ₹{(h.counter_price || h.offered_price).toFixed(2)}/kg
                    {h.message && <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>"{h.message}"</div>}
                  </span>
                  <span style={{ color: "var(--ink-soft)", fontSize: "10.5px" }}>
                    {new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #EDF2EB", paddingTop: 10, flexWrap: "wrap" }}>
        {!isAccepted && !isRejected && (
          <>
            <button
              className="btn btn-primary"
              style={{ flex: 1.5, justifyContent: "center", fontSize: "12.5px" }}
              onClick={handleAccept}
              disabled={actionLoading}
            >
              Accept Offer & Generate Contract <ArrowRight size={14} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: "center", fontSize: "12.5px" }}
              onClick={() => setShowCounter(!showCounter)}
            >
              Counter
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 0.8, justifyContent: "center", fontSize: "12px", color: "var(--danger)" }}
              onClick={handleReject}
              disabled={actionLoading}
            >
              Reject
            </button>
          </>
        )}

        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: "11.5px", color: "var(--ink-soft)", marginLeft: "auto" }}
          onClick={() => setShowHistoryModal(!showHistoryModal)}
        >
          <History size={13} style={{ marginRight: 4 }} /> History ({history.length || 1})
        </button>
      </div>
    </div>
  );
}

export default OfferIntelligenceCard;
