import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  Store,
  Users,
  RefreshCw,
} from "lucide-react";
import marketIntelligenceApi from "../services/marketIntelligenceApi";
import type { MarketIntelligenceOverview } from "../services/marketIntelligenceApi";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  cropName?: string;
  quantityQuintals?: number;
}

export function MarketIntelligenceSummaryCard({
  cropName = "Tomato",
  quantityQuintals = 30,
}: Props) {
  const { t } = useLanguage();
  const [overview, setOverview] = useState<MarketIntelligenceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketIntelligenceApi.getOverview(cropName, quantityQuintals);
      setOverview(data);
    } catch (err: unknown) {
      console.error("Failed to fetch market intelligence summary", err);
      setError("Unable to load real-time market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [cropName, quantityQuintals]);

  if (loading) {
    return (
      <div className="card card-pad" style={{ background: "#FAFCF9", border: "1px solid var(--line)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshCw size={18} className="animate-spin" color="var(--green-deep)" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-soft)" }}>
            Analyzing real-time mandi prices and net realization...
          </span>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return null;
  }

  const { decision, analytics, comparison, buyer_opportunities } = overview;
  const bestMarket = comparison.markets[0];

  const decisionColor =
    decision.recommendation === "SELL"
      ? { bg: "#E6F4EA", text: "#137333", border: "#CEEAD6" }
      : decision.recommendation === "WAIT"
      ? { bg: "#FEF7E0", text: "#B06000", border: "#FEEFC3" }
      : { bg: "#E8F0FE", text: "#1A73E8", border: "#D2E3FC" };

  return (
    <div
      className="card card-pad"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAF7 100%)",
        border: "1px solid #D8E3D8",
        borderRadius: "14px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          borderBottom: "1px solid #EDF2EB",
          paddingBottom: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: "var(--green-soft)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Sparkles size={16} color="var(--green-deep)" />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Phase 5 Market Intelligence & Price Discovery
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
              {cropName} · Best Selling Strategy
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
              backgroundColor: decisionColor.bg,
              color: decisionColor.text,
              border: `1px solid ${decisionColor.border}`,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            AI RECOMMENDATION: {decision.recommendation}
          </span>
          <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 600 }}>
            {decision.confidence_score}% Confidence
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 16, alignItems: "center" }}>
        {/* Left: Net Realization Highlight */}
        <div>
          <div style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: 4 }}>
            Highest Farmer In-Hand Realization:
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "var(--green-deep)" }}>
              ₹{decision.expected_net_per_kg.toFixed(2)}/kg
            </span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>
              at {decision.recommended_mandi}
            </span>
          </div>

          <p style={{ fontSize: "12.5px", color: "var(--ink-mid)", marginTop: 6, lineHeight: 1.4 }}>
            {decision.action_summary}
          </p>

          {/* Key Metric Tags */}
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "11.5px",
                padding: "3px 8px",
                borderRadius: 6,
                background: "#F1F5F0",
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              {analytics.trend_direction === "UPWARD" ? (
                <TrendingUp size={13} color="#137333" />
              ) : analytics.trend_direction === "DOWNWARD" ? (
                <TrendingDown size={13} color="#C5221F" />
              ) : (
                <Minus size={13} color="#666" />
              )}
              <span>Trend: {analytics.trend_direction} ({analytics.trend_percentage_7d > 0 ? "+" : ""}{analytics.trend_percentage_7d}%)</span>
            </div>

            {buyer_opportunities.opportunities_count > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "11.5px",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "#FFF4E5",
                  color: "#B06000",
                  fontWeight: 600,
                }}
              >
                <Users size={13} color="#B06000" />
                <span>{buyer_opportunities.opportunities_count} Direct Buyer Leads</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Net vs Gross Comparison & CTA */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #E6ECE4",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
            Top Mandi vs Gross Price:
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: 4 }}>
            <span>Recommended ({bestMarket ? bestMarket.mandi_name : "Local"}):</span>
            <strong style={{ color: "var(--green-deep)" }}>₹{decision.expected_net_per_kg.toFixed(2)}/kg net</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--ink-soft)", marginBottom: 8 }}>
            <span>Highest Listed ({comparison.highest_gross_mandi_name}):</span>
            <span>₹{comparison.highest_gross_price_per_kg.toFixed(2)}/kg gross</span>
          </div>

          <div style={{ borderTop: "1px dashed #E2E7DE", paddingTop: 8, marginTop: 6, display: "flex", gap: 8 }}>
            <Link
              to="/market"
              className="btn btn-outline"
              style={{
                flex: 1,
                fontSize: "12px",
                padding: "6px 8px",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Store size={13} /> {t("nav.market")}
            </Link>
            <Link
              to="/lots/create"
              className="btn btn-primary"
              style={{
                flex: 1,
                fontSize: "12px",
                padding: "6px 8px",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {t("decision.sell")} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MarketIntelligenceSummaryCard;
