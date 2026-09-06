import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { BuyerMatchResult } from "../services/buyerMatchingApi";

interface Props {
  match: BuyerMatchResult;
  cropName: string;
  quantityQtl: number;
}

export function SmartBuyerCard({ match, cropName, quantityQtl }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const isVerified = match.verification_status === "VERIFIED" || match.verified;
  const scoreColor =
    match.match_score >= 85
      ? { bg: "#E6F4EA", text: "#137333", border: "#CEEAD6" }
      : match.match_score >= 70
      ? { bg: "#E8F0FE", text: "#1A73E8", border: "#D2E3FC" }
      : { bg: "#FEF7E0", text: "#B06000", border: "#FEEFC3" };

  return (
    <div
      className="card card-pad"
      style={{
        background: "#FFFFFF",
        border: match.match_score >= 85 ? "2px solid #176B45" : "1px solid var(--line)",
        borderRadius: "14px",
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{match.buyer_name}</h3>
            {isVerified ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: "#137333",
                  background: "#E6F4EA",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                <CheckCircle2 size={13} color="#137333" /> Verified Enterprise
              </span>
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#B06000",
                  background: "#FFF4E5",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                Verification Pending
              </span>
            )}
            <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>· ★ {match.rating}</span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 4 }}>
            {match.organization || match.business_type} · {match.location}
          </div>
        </div>

        {/* Match Score Badge */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 900,
              backgroundColor: scoreColor.bg,
              color: scoreColor.text,
              border: `1px solid ${scoreColor.border}`,
              display: "inline-block",
            }}
          >
            MATCH SCORE {match.match_score}/100
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", fontWeight: 700, marginTop: 2 }}>
            {match.match_level}
          </div>
        </div>
      </div>

      {/* Pricing and Net Advantage Bar */}
      <div
        style={{
          background: "#F8FAF7",
          border: "1px solid #E4ECE0",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          margin: "10px 0 14px",
        }}
      >
        <div>
          <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", textTransform: "uppercase", fontWeight: 700 }}>
            Indicative Direct Offer
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--green-deep)" }}>
            ₹{match.indicative_price_per_kg.toFixed(2)}
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>/kg (₹{(match.indicative_price_per_kg * 100).toFixed(0)}/Qtl)</span>
          </div>
        </div>

        {match.comparison && match.comparison.net_advantage_total > 0 && (
          <div
            style={{
              background: "#E6F4EA",
              border: "1px solid #CEEAD6",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "11px", color: "#137333", fontWeight: 800 }}>ESTIMATED IN-HAND ADVANTAGE</div>
            <div style={{ fontSize: "15px", fontWeight: 900, color: "#137333" }}>
              +₹{match.comparison.net_advantage_total.toLocaleString("en-IN")} (+₹{match.comparison.net_advantage_per_kg.toFixed(2)}/kg)
            </div>
          </div>
        )}
      </div>

      {/* Why This Buyer - Reasons */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: 6 }}>
          Why this buyer matches your lot:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {match.reasons.map((r, i) => (
            <div key={i} style={{ fontSize: "12.5px", display: "flex", alignItems: "baseline", gap: 6, color: "var(--ink)" }}>
              <span style={{ color: "var(--green-deep)", fontWeight: 900 }}>✓</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
        {match.warnings.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {match.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: "12px", display: "flex", alignItems: "baseline", gap: 6, color: "#B06000" }}>
                <AlertTriangle size={12} color="#B06000" style={{ flexShrink: 0 }} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct vs Mandi Net Comparison Expandable */}
      {match.comparison && (
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded(!expanded)}
            style={{ fontSize: "12px", padding: 0, color: "var(--green-deep)", fontWeight: 700 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide Direct vs Mandi Breakdown" : "Compare Direct Sale vs Mandi Route"}
          </button>

          {expanded && (
            <div
              style={{
                background: "#FAFCF9",
                border: "1px solid #D8E4D5",
                borderRadius: "8px",
                padding: "12px",
                marginTop: 8,
                fontSize: "12.5px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                {/* Mandi Route */}
                <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #E2E7DE" }}>
                  <div style={{ fontWeight: 800, color: "var(--ink-soft)", marginBottom: 4 }}>
                    <Store size={12} style={{ display: "inline", marginRight: 4 }} /> APMC Mandi Route
                  </div>
                  <div>Gross: ₹{match.comparison.mandi_gross_revenue.toLocaleString("en-IN")}</div>
                  <div style={{ color: "var(--danger)" }}>- Freight: ₹{match.comparison.mandi_transport_cost.toLocaleString("en-IN")}</div>
                  <div style={{ color: "var(--danger)" }}>- Cess & Handling: ₹{match.comparison.mandi_handling_and_cess.toLocaleString("en-IN")}</div>
                  <div style={{ fontWeight: 800, marginTop: 4, color: "var(--ink)" }}>
                    Net: ₹{match.comparison.mandi_net_realization.toLocaleString("en-IN")} (₹{match.comparison.mandi_net_per_kg.toFixed(2)}/kg)
                  </div>
                </div>

                {/* Direct Buyer Route */}
                <div style={{ background: "#F4FAF5", padding: "8px 10px", borderRadius: 6, border: "1.5px solid var(--green-deep)" }}>
                  <div style={{ fontWeight: 800, color: "var(--green-deep)", marginBottom: 4 }}>
                    <TrendingUp size={12} style={{ display: "inline", marginRight: 4 }} /> Direct to {match.buyer_name}
                  </div>
                  <div>Gross: ₹{match.comparison.direct_gross_revenue.toLocaleString("en-IN")}</div>
                  <div style={{ color: "var(--danger)" }}>- Transport: ₹{match.comparison.direct_transport_cost.toLocaleString("en-IN")}</div>
                  <div>- APMC Cess: ₹0.00 (0% Exemption)</div>
                  <div style={{ fontWeight: 900, marginTop: 4, color: "var(--green-deep)" }}>
                    Net: ₹{match.comparison.direct_net_realization.toLocaleString("en-IN")} (₹{match.comparison.direct_net_per_kg.toFixed(2)}/kg)
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>{match.comparison.insight}</div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid #EDF2EB", paddingTop: 12 }}>
        <Link
          to={`/buyers/${match.buyer_id}`}
          className="btn btn-outline"
          style={{ flex: 1, justifyContent: "center", fontSize: "12.5px" }}
        >
          View Full Profile
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1.2, justifyContent: "center", fontSize: "12.5px", gap: 6 }}
          onClick={() =>
            navigate(
              `/lots/create?buyer=${match.buyer_id}&crop=${encodeURIComponent(cropName)}&qty=${quantityQtl * 100}&price=${match.indicative_price_per_kg}`
            )
          }
        >
          Create Lot for Buyer <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default SmartBuyerCard;
