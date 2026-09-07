import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  ShieldCheck,
  TrendingUp,
  Store,
  RefreshCw,
  Phone,
  Building2,
} from "lucide-react";
import buyerMatchingApi, { type BuyerMatchResult } from "../services/buyerMatchingApi";
import { buyers as demoBuyers } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function BuyerDetailPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Local");

  const cropParam = params.get("crop") || "Tomato";
  const qtyParam = Number(params.get("qty") || 20);

  const [loading, setLoading] = useState(true);
  const [matchDetail, setMatchDetail] = useState<BuyerMatchResult | null>(null);

  useEffect(() => {
    async function loadBuyer() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await buyerMatchingApi.getBuyerMatchDetail(Number(id), cropParam, qtyParam);
        setMatchDetail(data);
      } catch (err) {
        console.warn("Could not fetch backend buyer detail, fallback to demo if available", err);
        // Fallback demo matching
        const demo = demoBuyers.find((b) => b.id === id || b.id === `b-${id}`) as any;
        if (demo) {
          const rating = demo.rating || 4.8;
          setMatchDetail({
            buyer_id: Number(id) || 1,
            buyer_name: demo.name,
            organization: demo.verified ? "Sahyadri Farmer Producer Co. Ltd" : undefined,
            location: demo.location,
            verified: demo.verified,
            verification_status: demo.verified ? "VERIFIED" : "PENDING",
            rating: rating,
            business_type: "FPO / Aggregator",
            indicative_price_per_kg: demo.offeredPrice,
            match_score: 92,
            match_level: "EXCELLENT_MATCH",
            reasons: [
              `Directly demanding ${demo.crop} at indicative rate ₹${demo.offeredPrice}/kg`,
              `Location within procurement distance (${demo.distanceKm} km)`,
              `High payment reliability rating (${rating} ★)`,
            ],
            warnings: [],
            factors: [
              { factor_name: "Crop Compatibility", score: 25, max_score: 25, explanation: `Demands ${demo.crop}`, is_positive: true },
              { factor_name: "Volume Match", score: 20, max_score: 20, explanation: "Within procurement quantity range", is_positive: true },
              { factor_name: "Price Competitiveness", score: 18, max_score: 20, explanation: "Higher than mandi average", is_positive: true },
              { factor_name: "Geographic Distance", score: 14, max_score: 15, explanation: `${demo.distanceKm} km from farm`, is_positive: true },
              { factor_name: "Buyer Verification", score: 10, max_score: 10, explanation: "Verified Enterprise", is_positive: true },
              { factor_name: "Payment Reliability", score: 5, max_score: 5, explanation: "Excellent settlement record", is_positive: true },
              { factor_name: "Logistics Feasibility", score: 5, max_score: 5, explanation: "Farm pickup supported", is_positive: true },
            ],
            comparison: {
              crop_name: demo.crop,
              quantity_qtl: qtyParam,
              quantity_kg: qtyParam * 100,
              direct_buyer_name: demo.name,
              direct_offer_price_per_kg: demo.offeredPrice,
              direct_gross_revenue: demo.offeredPrice * qtyParam * 100,
              direct_transport_cost: 800,
              direct_other_fees: 0,
              direct_net_realization: demo.offeredPrice * qtyParam * 100 - 800,
              direct_net_per_kg: demo.offeredPrice - 0.4,
              mandi_name: `${userDistrict} APMC Mandi`,
              mandi_price_per_kg: demo.offeredPrice - 3,
              mandi_gross_revenue: (demo.offeredPrice - 3) * qtyParam * 100,
              mandi_transport_cost: 1500,
              mandi_handling_and_cess: 1200,
              mandi_net_realization: (demo.offeredPrice - 3) * qtyParam * 100 - 2700,
              mandi_net_per_kg: demo.offeredPrice - 4.35,
              net_advantage_total: demo.offeredPrice * qtyParam * 100 - 800 - ((demo.offeredPrice - 3) * qtyParam * 100 - 2700),
              net_advantage_per_kg: 3.95,
              recommended_channel: "DIRECT_BUYER",
              insight: "Direct sale eliminates APMC commission and mandi handling charges, delivering higher net realization.",
            },
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadBuyer();
  }, [id, cropParam, qtyParam]);

  if (loading) {
    return (
      <div className="wrap" style={{ maxWidth: 760, textAlign: "center", padding: "60px 20px" }}>
        <RefreshCw size={32} className="animate-spin" color="var(--green-deep)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{t("common.loading", "Evaluating Smart Buyer Profile & Net Advantage...")}</h3>
      </div>
    );
  }

  if (!matchDetail) {
    return (
      <div className="wrap" style={{ maxWidth: 760, textAlign: "center", padding: "40px 20px" }}>
        <h2>Buyer Profile Not Found</h2>
        <p style={{ color: "var(--ink-soft)", marginTop: 6 }}>The requested buyer could not be retrieved.</p>
        <Link to="/buyers" className="btn btn-primary" style={{ marginTop: 16 }}>
          {t("common.back", "Back to")} {t("nav.buyers", "Buyer Marketplace")}
        </Link>
      </div>
    );
  }

  const isVerified = matchDetail.verification_status === "VERIFIED" || matchDetail.verified;

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      {/* Breadcrumb Back Link */}
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link
          to="/buyers"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> {t("common.back", "Back to")} {t("nav.buyers", "Buyer Marketplace")}
        </Link>
      </div>

      {/* Page Header with Buyer Details */}
      <div className="page-header" style={{ paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{matchDetail.buyer_name}</h1>
              {isVerified ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#137333",
                    background: "#E6F4EA",
                    padding: "3px 10px",
                    borderRadius: 12,
                  }}
                >
                  <CheckCircle2 size={14} color="#137333" /> Verified Enterprise
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#B06000",
                    background: "#FFF4E5",
                    padding: "3px 10px",
                    borderRadius: 12,
                  }}
                >
                  Verification Pending
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: "13.5px", color: "var(--ink-soft)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Building2 size={14} color="var(--green-deep)" /> {matchDetail.organization || matchDetail.business_type}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={14} color="var(--green-deep)" /> {matchDetail.location}
              </span>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>★ {matchDetail.rating} / 5.0 Rating</span>
            </div>
          </div>

          {/* Transparent Match Score */}
          <div style={{ textAlign: "right", background: "#F4FAF5", padding: "10px 16px", borderRadius: 12, border: "1px solid #CEEAD6" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--green-deep)", textTransform: "uppercase" }}>
              Smart Match Score
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "var(--green-deep)", lineHeight: 1.1 }}>
              {matchDetail.match_score}<span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-soft)" }}>/100</span>
            </div>
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#137333", marginTop: 2 }}>
              {matchDetail.match_level}
            </div>
          </div>
        </div>
      </div>

      {/* Indicative Rate Banner */}
      <div
        className="card card-pad"
        style={{
          background: "linear-gradient(135deg, #176B45 0%, #0F4C2E 100%)",
          color: "#FFFFFF",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: "12px", textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>
            Indicative Direct Purchase Rate
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, marginTop: 2 }}>
            ₹{matchDetail.indicative_price_per_kg.toFixed(2)}{" "}
            <span style={{ fontSize: "14px", fontWeight: 600, opacity: 0.9 }}>/kg (₹{(matchDetail.indicative_price_per_kg * 100).toFixed(0)}/Quintal)</span>
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9, marginTop: 4 }}>
            For {cropParam} · Minimum Volume: 5 Qtl · Payment: Direct Bank / UPI Transfer
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            navigate(
              `/lots/create?buyer=${matchDetail.buyer_id}&crop=${encodeURIComponent(cropParam)}&qty=${qtyParam * 100}&price=${matchDetail.indicative_price_per_kg}`
            )
          }
          style={{
            background: "#FFFFFF",
            color: "var(--green-deep)",
            fontWeight: 800,
            padding: "12px 20px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Package size={16} /> Create Trade Lot for This Buyer
        </button>
      </div>

      {/* 7-Factor Explainability Breakdown */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 12 }}>
          7-Factor Match Transparency Breakdown
        </h3>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginBottom: 16 }}>
          KissanSetu AI transparently scores compatibility across crop, volume tender, distance, price competitiveness, verification status, payment reliability, and logistics.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {matchDetail.factors?.map((f, idx) => {
            const pct = Math.round((f.score / f.max_score) * 100);
            return (
              <div key={idx} style={{ background: "#F9FBF8", padding: "10px 14px", borderRadius: 8, border: "1px solid #E5EBE2" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: "13.5px" }}>{f.factor_name}</div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: pct >= 80 ? "var(--green-deep)" : "#B06000" }}>
                    {f.score} / {f.max_score} pts ({pct}%)
                  </div>
                </div>
                {/* Progress Bar */}
                <div style={{ width: "100%", height: 6, background: "#E0E7DD", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: pct >= 80 ? "var(--green-deep)" : pct >= 50 ? "var(--saffron)" : "var(--terracotta)",
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>{f.explanation}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct vs Mandi Net Realization Comparison */}
      {matchDetail.comparison && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={20} color="#176B45" />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>
              Direct Sale vs APMC Mandi Net Realization Matrix
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Mandi Card */}
            <div style={{ background: "#FAFAF7", padding: "14px", borderRadius: 10, border: "1px solid #E2E2D8" }}>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Store size={15} /> {matchDetail.comparison.mandi_name}
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px" }}>Mandi Price Rate</span>
                <span className="v" style={{ fontWeight: 700, fontSize: "12.5px" }}>₹{matchDetail.comparison.mandi_price_per_kg}/kg</span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px" }}>Gross Revenue</span>
                <span className="v" style={{ fontSize: "12.5px" }}>₹{matchDetail.comparison.mandi_gross_revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>Freight & Transport</span>
                <span className="v" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>-₹{matchDetail.comparison.mandi_transport_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>APMC Cess & Handling</span>
                <span className="v" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>-₹{matchDetail.comparison.mandi_handling_and_cess.toLocaleString("en-IN")}</span>
              </div>
              <div className="pf-row" style={{ padding: "8px 0 0", borderTop: "1.5px solid #DCDCD0", marginTop: 6 }}>
                <span className="l" style={{ fontWeight: 800, fontSize: "13px" }}>Net In-Hand</span>
                <span className="v" style={{ fontWeight: 900, fontSize: "15px", color: "var(--ink)" }}>
                  ₹{matchDetail.comparison.mandi_net_realization.toLocaleString("en-IN")} (₹{matchDetail.comparison.mandi_net_per_kg.toFixed(2)}/kg)
                </span>
              </div>
            </div>

            {/* Direct Buyer Card */}
            <div style={{ background: "#F2FAF4", padding: "14px", borderRadius: 10, border: "2px solid var(--green-deep)" }}>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--green-deep)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={15} color="#176B45" /> Direct to {matchDetail.buyer_name}
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px" }}>Agreed Direct Rate</span>
                <span className="v" style={{ fontWeight: 700, fontSize: "12.5px", color: "var(--green-deep)" }}>
                  ₹{matchDetail.comparison.direct_offer_price_per_kg}/kg
                </span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px" }}>Gross Revenue</span>
                <span className="v" style={{ fontSize: "12.5px" }}>₹{matchDetail.comparison.direct_gross_revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>Direct Transport Cost</span>
                <span className="v" style={{ fontSize: "12.5px", color: "var(--terracotta)" }}>-₹{matchDetail.comparison.direct_transport_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="pf-row" style={{ padding: "4px 0" }}>
                <span className="l" style={{ fontSize: "12.5px" }}>APMC Cess Exemption</span>
                <span className="v" style={{ fontSize: "12.5px", color: "var(--green-deep)", fontWeight: 700 }}>₹0 (Direct Exemption)</span>
              </div>
              <div className="pf-row" style={{ padding: "8px 0 0", borderTop: "1.5px solid #B8DCBE", marginTop: 6 }}>
                <span className="l" style={{ fontWeight: 800, fontSize: "13px", color: "var(--green-deep)" }}>Net In-Hand</span>
                <span className="v" style={{ fontWeight: 900, fontSize: "16px", color: "var(--green-deep)" }}>
                  ₹{matchDetail.comparison.direct_net_realization.toLocaleString("en-IN")} (₹{matchDetail.comparison.direct_net_per_kg.toFixed(2)}/kg)
                </span>
              </div>
            </div>
          </div>

          {matchDetail.comparison.net_advantage_total > 0 && (
            <div style={{ background: "#E6F4EA", border: "1px solid #CEEAD6", padding: "10px 14px", borderRadius: 8 }}>
              <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#137333" }}>
                💡 Direct Net Profit Advantage: +₹{matchDetail.comparison.net_advantage_total.toLocaleString("en-IN")} (+₹{matchDetail.comparison.net_advantage_per_kg.toFixed(2)}/kg)
              </div>
              <div style={{ fontSize: "12.5px", color: "#137333", marginTop: 2 }}>
                {matchDetail.comparison.insight}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buyer Specifications Card */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          Procurer Specifications & Tender Guidelines
        </h3>

        <div className="pf-row">
          <span className="l">Target Produce Crop</span>
          <span className="v" style={{ fontWeight: 800 }}>{cropParam}</span>
        </div>
        <div className="pf-row">
          <span className="l">Procurement Quantity Range</span>
          <span className="v">500 kg to 5,000 kg per lot</span>
        </div>
        <div className="pf-row">
          <span className="l">Mandatory Quality Standard</span>
          <span className="v">Grade A / Export Table Grade (Firm, sorted, undamaged)</span>
        </div>
        <div className="pf-row">
          <span className="l">Payment & Settlement Mode</span>
          <span className="v">Direct Bank Transfer (NEFT/RTGS/UPI) within T+1 Day</span>
        </div>
        <div className="pf-row">
          <span className="l">Logistics & Farm Pickup</span>
          <span className="v">Farm-gate pickup scheduled via KissanSetu tracking system</span>
        </div>

        {matchDetail.phone && (
          <div className="pf-row">
            <span className="l">Contact Support</span>
            <span className="v" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Phone size={13} color="var(--green-deep)" /> {matchDetail.phone}
            </span>
          </div>
        )}
      </div>

      {/* Verified Guarantee Note */}
      <div className="card card-pad" style={{ background: "var(--cream)", border: "1px solid #EADBBE", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} color="#176B45" />
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>KissanSetu Verified Trade Assurance</h4>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.5 }}>
          All verified institutional buyers on KissanSetu undergo business verification. Transactions are logged with immutable audit milestones, transparent delivery tracking, and grievance dispute resolution.
        </p>
      </div>
    </div>
  );
}

export default BuyerDetailPage;
