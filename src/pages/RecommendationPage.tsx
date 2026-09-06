import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  Store,
  Users,
} from "lucide-react";
import { DecisionBadge } from "../components/DecisionBadge";
import { NetRealizationCalculator } from "../components/NetRealizationCalculator";
import { useAppState } from "../context/AppStateContext";
import { marketsByCrop } from "../data/demo";
import type { Decision } from "../types";

export function RecommendationPage() {
  const { crops, activeCropId, setActiveCropId } = useAppState();
  const [showCalc, setShowCalc] = useState(false);

  const activeCrop = crops.find((c) => c.id === activeCropId) || crops[0];
  const cropMarkets = (marketsByCrop as Record<string, any>)[activeCrop?.name] || marketsByCrop.Tomato;

  const decision: Decision = activeCrop?.recommendation || "SELL";
  const confidence = activeCrop?.confidence || 86;

  return (
    <div className="wrap">
      {/* Header with Crop Selector */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 0 14px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>AI Decision Center</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Transparent AI recommendation scoring combining weather risk, crop maturity, buyer demand & transport deductions.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>Select Crop:</label>
          <select
            value={activeCrop?.id}
            onChange={(e) => setActiveCropId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", fontWeight: 600 }}
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.quantityKg} {c.unit || "kg"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Large Decision Hero Card */}
      <div className="card card-pad" style={{ textAlign: "center", padding: "34px 24px", marginTop: 4 }}>
        <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", letterSpacing: "0.06em", marginBottom: 12 }}>
          INTELLIGENT SELLING ADVISORY FOR {activeCrop?.name?.toUpperCase()}
        </div>

        <div style={{ transform: "scale(1.25)", display: "inline-flex", marginBottom: 12 }}>
          <DecisionBadge decision={decision} size="lg" />
        </div>

        <div style={{ maxWidth: 440, margin: "16px auto 0" }}>
          <div className="reco-stat" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 700, color: "var(--ink-soft)" }}>
              <span>Decision Confidence</span>
              <span style={{ color: "var(--green-deep)" }}>{confidence}% (High Certainty)</span>
            </div>
            <div className="confidence-track">
              <div className="confidence-fill" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Strategy Alternatives: SELL vs WAIT vs SWITCH */}
      <div className="alt-row">
        <div className={`alt-card ${decision === "SELL" ? "selected" : ""}`}>
          {decision === "SELL" && <span className="picked-tag">AI TOP PICK</span>}
          <div className="alt-badge">
            <DecisionBadge decision="SELL" size="sm" />
          </div>
          <div className="alt-note">
            Sell to {activeCrop?.bestMarket || "Nashik Market"} now at ₹{activeCrop?.netRealization || 29}/kg expected net realization before Day 3 rain risk.
          </div>
        </div>

        <div className={`alt-card ${decision === "WAIT" ? "selected" : ""}`}>
          {decision === "WAIT" && <span className="picked-tag">AI TOP PICK</span>}
          <div className="alt-badge">
            <DecisionBadge decision="WAIT" size="sm" />
          </div>
          <div className="alt-note">
            Hold for 3–5 days if storage is available and weather risk remains low to let crop attain optimal maturity and higher pricing.
          </div>
        </div>

        <div className={`alt-card ${decision === "SWITCH" ? "selected" : ""}`}>
          {decision === "SWITCH" && <span className="picked-tag">AI TOP PICK</span>}
          <div className="alt-badge">
            <DecisionBadge decision="SWITCH" size="sm" />
          </div>
          <div className="alt-note">
            Switch destination from local mandi to Ahmednagar or Pimpalgaon for superior net realization after factoring transport costs.
          </div>
        </div>
      </div>

      {/* Main Grid: Market Comparison & Why Reasoning */}
      <div className="grid-2" style={{ gridTemplateColumns: "1.25fr 0.75fr" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Mandi Net Realization Ranking</h3>
            <span className="demo-tag">COMPARED AFTER FREIGHT</span>
          </div>

          {cropMarkets.map((m: any) => (
            <div key={m.id} className={`mkt-compare-card ${m.recommended ? "recommended" : ""}`}>
              {m.recommended && <span className="rec-flag">BEST NET REALIZATION</span>}
              <div>
                <div className="mkt-name">
                  {m.name}{" "}
                  <span style={{ fontWeight: 500, fontSize: "12px", color: "var(--ink-soft)" }}>
                    · {m.distanceKm} km away
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 4 }}>
                  Transport freight: ₹{m.transportCost} (₹{(m.transportCost / (activeCrop?.quantityKg || 500)).toFixed(1)}/kg)
                </div>
              </div>

              <div className="mkt-figs">
                <div className="mkt-fig">
                  <div className="l">Mandi Listed Price</div>
                  <div className="v">₹{m.pricePerKg}/kg</div>
                </div>
                <div className="mkt-fig">
                  <div className="l">Expected Net Realization</div>
                  <div className="v net" style={{ fontSize: "17px" }}>
                    ₹{m.netPerKg}/kg
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p className="disclaimer" style={{ marginBottom: 20 }}>
            ℹ️ <strong>Core Economic Insight:</strong> Highest listed market price (e.g. Pune ₹32/kg) does not equal highest farmer return due to ₹2,800 logistics deduction, yielding ₹24/kg net. Nashik at ₹30/kg yields ₹29/kg net.
          </p>

          <button
            className="btn btn-secondary btn-block"
            type="button"
            onClick={() => setShowCalc((prev) => !prev)}
            style={{ marginBottom: 16 }}
          >
            {showCalc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showCalc ? "Hide Net Realization Calculator" : "Open Interactive Net Realization Calculator"}
          </button>

          {showCalc && (
            <div style={{ marginBottom: 20 }}>
              <NetRealizationCalculator
                quantityKg={activeCrop?.quantityKg || 500}
                sellingPrice={30}
                transportCost={400}
                storageCost={0}
                estimatedLoss={120}
              />
            </div>
          )}
        </div>

        <div>
          <div className="card card-pad">
            <h3 style={{ fontSize: "15.5px", fontWeight: 800, marginBottom: 14 }}>
              Why this recommendation?
            </h3>
            <div className="reason-list">
              <div className="reason-item">
                <Check size={18} color="#176B45" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Strong Wholesale Demand:</strong> 3 verified buyers actively procurement-matching in Nashik.
                </span>
              </div>
              <div className="reason-item">
                <Check size={18} color="#176B45" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Highest In-Hand Realization:</strong> Expected net return of ₹{activeCrop?.netRealization || 29}/kg beats all neighboring districts.
                </span>
              </div>
              <div className="reason-item">
                <Check size={18} color="#176B45" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Minimal Freight Deduction:</strong> Only ₹400 freight cost compared to ₹2,800 for Pune.
                </span>
              </div>
              <div className="reason-item">
                <Check size={18} color="#176B45" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Elevated Meteorological Risk:</strong> Rain probability increases sharply to 70% after Day 2.
                </span>
              </div>
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: 12 }}>
              Execute Recommended Action
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link className="btn btn-primary btn-block" to="/buyers">
                <Users size={16} /> Find Verified Buyers for {activeCrop?.name}
              </Link>
              <Link className="btn btn-saffron btn-block" to={`/lots/create?crop=${activeCrop?.name}`}>
                <Package size={16} /> Create Selling Lot Now
              </Link>
              <Link className="btn btn-outline btn-block" to="/market">
                <Store size={16} /> Open Full Market Intelligence
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
