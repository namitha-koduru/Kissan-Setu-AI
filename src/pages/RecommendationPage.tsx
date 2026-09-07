import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Store,
  Sprout,
  FlaskConical,
  CloudRain,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  Droplets,
  Wind,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { DecisionBadge } from "../components/DecisionBadge";
import { NetRealizationCalculator } from "../components/NetRealizationCalculator";
import { SoilFormModal } from "../components/SoilFormModal";
import { useAppState } from "../context/AppStateContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { farmIntelligenceApi } from "../services/farmIntelligenceApi";
import type { FarmIntelligenceOverview } from "../services/farmIntelligenceApi";
import type { Decision } from "../types";

export function RecommendationPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { crops, activeCropId, setActiveCropId } = useAppState();
  const [activeTab, setActiveTab] = useState<"intelligence" | "market">("intelligence");
  const [showCalc, setShowCalc] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [expandedCrop, setExpandedCrop] = useState<string | null>("Onion");

  const [intelligence, setIntelligence] = useState<FarmIntelligenceOverview | null>(null);

  const farmerId = user?.id ? Number(user.id) : 1;

  const loadIntelligence = async () => {
    try {
      const data = await farmIntelligenceApi.getOverview(farmerId);
      setIntelligence(data);
    } catch (err: any) {
      console.warn("Could not load farm intelligence from API:", err);
    }
  };


  useEffect(() => {
    loadIntelligence();
  }, [farmerId]);

  const activeCrop = crops.find((c) => c.id === activeCropId) || crops[0];
  const decision: Decision = activeCrop?.recommendation || "SELL";
  const confidence = activeCrop?.confidence || 86;


  return (
    <div className="wrap">
      {/* Page Header with Tab Switcher */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-md mb-sm">
            <div className="intelligence-tag">
              <Sparkles size={13} />
              <span>Phase 4 Agronomic Engine</span>
            </div>
            <span className="text-xs text-muted">
              {intelligence?.farm?.location || user?.location || "Your Farm"}
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{t("recommendations.title")}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 3 }}>
            {t("recommendations.subtitle")}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            type="button"
            onClick={() => setActiveTab("intelligence")}
            className={`tab-switcher-btn ${activeTab === "intelligence" ? "active" : ""}`}
          >
            <Sprout size={16} />
            <span>Farm Intelligence</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("market")}
            className={`tab-switcher-btn ${activeTab === "market" ? "active" : ""}`}
          >
            <Store size={16} />
            <span>{t("market.decision")}</span>
          </button>
        </div>
      </div>

      {activeTab === "intelligence" ? (
        /* ==================== TAB 1: FARM INTELLIGENCE ==================== */
        <div>
          {/* Farm Context & Data Quality Banner */}
          <div
            className="card card-pad"
            style={{
              padding: "16px 20px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #176B45, #0f4c30)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: "20px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a7f3d0" }}>
                Active Farm Profile
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, marginTop: 2 }}>
                {intelligence?.farm?.farmer_name || user?.name || "Farmer"} · {intelligence?.farm?.location || user?.location || "Your Farm"}
              </div>
              <div style={{ fontSize: "13px", color: "#d1fae5", marginTop: 2 }}>
                Land Area: <strong>{intelligence?.farm?.total_acreage || 3.5} acres</strong> · Active Crops:{" "}
                <strong>{intelligence?.farm?.active_crops_count || crops.length}</strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div style={{ color: "#a7f3d0", fontSize: "10.5px", fontWeight: 700 }}>DATA QUALITY</div>
                <div style={{ fontWeight: 800 }}>{intelligence?.data_completeness?.data_quality || "Verified"}</div>
              </div>

              <button
                type="button"
                onClick={() => setShowSoilModal(true)}
                className="btn"
                style={{
                  background: "#fff",
                  color: "#176B45",
                  fontWeight: 800,
                  fontSize: "13px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FlaskConical size={16} />
                <span>Edit Soil Test</span>
              </button>
            </div>
          </div>

          {/* 2-Column Grid: Soil Insights & Weather Intelligence */}
          <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {/* 1. Soil Insights Card */}
            <div className="card card-pad" style={{ padding: "20px", borderRadius: "14px", background: "#fff", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FlaskConical size={19} color="#176B45" />
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Soil Health Insights</h3>
                </div>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(23, 107, 69, 0.12)",
                    color: "#176B45",
                  }}
                >
                  Type: {intelligence?.soil?.profile?.soil_type || "Black"} Soil
                </span>
              </div>

              {/* Soil Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }}>
                <div style={{ background: "#f8f8f6", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Soil pH</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>
                    {intelligence?.soil?.profile?.ph ?? 7.2}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--green-deep)", fontWeight: 700 }}>
                    {intelligence?.soil?.ph_status?.toUpperCase() || "OPTIMAL"}
                  </div>
                </div>

                <div style={{ background: "#f8f8f6", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Nitrogen (N)</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>
                    {intelligence?.soil?.profile?.nitrogen ?? 240}
                  </div>
                  <div
                    style={{
                      fontSize: "10.5px",
                      color: intelligence?.soil?.nitrogen_status === "low" ? "#ca8a04" : "var(--green-deep)",
                      fontWeight: 700,
                    }}
                  >
                    {intelligence?.soil?.nitrogen_status?.toUpperCase() || "LOW"}
                  </div>
                </div>

                <div style={{ background: "#f8f8f6", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Phosphorus (P)</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>
                    {intelligence?.soil?.profile?.phosphorus ?? 18.5}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--green-deep)", fontWeight: 700 }}>
                    {intelligence?.soil?.phosphorus_status?.toUpperCase() || "MED"}
                  </div>
                </div>

                <div style={{ background: "#f8f8f6", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Potassium (K)</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>
                    {intelligence?.soil?.profile?.potassium ?? 295}
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--green-deep)", fontWeight: 700 }}>
                    {intelligence?.soil?.potassium_status?.toUpperCase() || "HIGH"}
                  </div>
                </div>
              </div>

              {/* Soil Observations */}
              <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
                {intelligence?.soil?.observations?.slice(0, 3).map((obs, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ color: "#176B45", fontWeight: 800 }}>•</span>
                    <span>{obs}</span>
                  </div>
                )) || (
                  <div>Soil pH is slightly alkaline; Nitrogen is slightly low for heavy vegetable feeders.</div>
                )}
              </div>
            </div>

            {/* 2. Weather Intelligence & Signals Card */}
            <div className="card card-pad" style={{ padding: "20px", borderRadius: "14px", background: "#fff", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CloudRain size={19} color="#1e40af" />
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Weather Signals</h3>
                </div>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background:
                      intelligence?.weather?.rain_risk === "high"
                        ? "rgba(234, 179, 8, 0.15)"
                        : "rgba(23, 107, 69, 0.12)",
                    color: intelligence?.weather?.rain_risk === "high" ? "#854d0e" : "#176B45",
                  }}
                >
                  Rain Risk: {intelligence?.weather?.rain_risk?.toUpperCase() || "MEDIUM"}
                </span>
              </div>

              {/* Weather Signals Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                <div style={{ background: "#f8f8f6", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Droplets size={18} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Irrigation Action</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)" }}>
                      {intelligence?.weather?.irrigation_need?.toUpperCase() || "REDUCED"}
                    </div>
                  </div>
                </div>

                <div style={{ background: "#f8f8f6", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Wind size={18} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 700 }}>Spraying Window</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)" }}>
                      {intelligence?.weather?.spraying_risk?.toUpperCase() || "CAUTION"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Advisories */}
              <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
                {intelligence?.weather?.advisories?.slice(0, 2).map((adv, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ color: "#ca8a04", fontWeight: 800 }}>•</span>
                    <span>{adv}</span>
                  </div>
                )) || (
                  <div>Precipitation expected after 48 hours. Inspect field drainage to prevent waterlogging.</div>
                )}
              </div>
            </div>
          </div>

          {/* Explainable Crop Suitability Rankings Section */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>🌱 Crop Suitability Rankings</h2>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Calculated from soil compatibility, pH, nutrient demands, seasonal climate & mandi offtake
                </p>
              </div>
              <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                Click any crop for explainable reasons
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(intelligence?.crop_suitability || []).map((item, idx) => {
                const isExpanded = expandedCrop === item.crop;
                return (
                  <div
                    key={item.crop}
                    className="card"
                    style={{
                      borderRadius: "14px",
                      border: idx === 0 ? "2px solid #176B45" : "1px solid var(--line)",
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        background: isExpanded ? "#fbfbfa" : "#fff",
                      }}
                      onClick={() => setExpandedCrop(isExpanded ? null : item.crop)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            background: idx === 0 ? "#176B45" : "#ebebe8",
                            color: idx === 0 ? "#fff" : "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                              {item.crop}
                            </span>
                            {idx === 0 && (
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  background: "#dcfce7",
                                  color: "#166534",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  textTransform: "uppercase",
                                }}
                              >
                                TOP SUITABILITY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
                            Season: {item.optimal_season} · ~{item.expected_duration_days || 120} days
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ textAlign: "right", minWidth: 110 }}>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-deep)" }}>
                            {item.suitability_score}%
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 600 }}>
                            {item.compatibility_level}
                          </div>
                        </div>
                        <div style={{ color: "var(--ink-soft)" }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Breakdown Card */}
                    {isExpanded && (
                      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", background: "#fafaf8" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                          {/* Reasons */}
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#176B45", marginBottom: 6 }}>
                              WHY THIS CROP IS SUITABLE:
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12.5px", color: "var(--ink)" }}>
                              {item.reasons.map((r, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                  <CheckCircle2 size={15} color="#176B45" style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Risks & Suggestions */}
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#b45309", marginBottom: 6 }}>
                              RISKS & AGRONOMIC ADVICE:
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12.5px", color: "var(--ink)" }}>
                              {item.risks.map((rk, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                  <AlertTriangle size={15} color="#ca8a04" style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span>{rk}</span>
                                </div>
                              ))}
                              {item.suggestions.map((sug, i) => (
                                <div key={`sug-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 6, color: "var(--ink-soft)" }}>
                                  <Info size={15} color="#6b7280" style={{ marginTop: 2, flexShrink: 0 }} />
                                  <span>{sug}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily & Weekly Farm Action Plan Section */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>👨‍🌾 Farm Action Plan</h2>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Prioritized agronomic tasks derived from live weather, soil, and active crop stages
                </p>
              </div>
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>
              {/* Today's Tasks */}
              <div className="card card-pad" style={{ padding: "20px", borderRadius: "14px", background: "#fff", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Clock size={18} color="#ef4444" />
                  <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>TODAY'S PRIORITIES</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {intelligence?.action_plan?.today?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: item.priority === "high" ? "rgba(239, 68, 68, 0.05)" : "rgba(23, 107, 69, 0.04)",
                        borderLeft: item.priority === "high" ? "4px solid #ef4444" : "4px solid #176B45",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>{item.title}</span>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: item.priority === "high" ? "#fee2e2" : "#dcfce7",
                            color: item.priority === "high" ? "#991b1b" : "#166534",
                          }}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: "1.4" }}>
                        {item.action}
                      </p>
                    </div>
                  )) || (
                    <div style={{ fontSize: "13px", color: "var(--ink-soft)" }}>No urgent tasks for today.</div>
                  )}
                </div>
              </div>

              {/* This Week's Plan */}
              <div className="card card-pad" style={{ padding: "20px", borderRadius: "14px", background: "#fff", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Calendar size={18} color="#176B45" />
                  <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>THIS WEEK</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {intelligence?.action_plan?.this_week?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#f8f8f6",
                        borderLeft: "3px solid #ca8a04",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>{item.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 2 }}>{item.action}</div>
                    </div>
                  )) || (
                    <div style={{ fontSize: "13px", color: "var(--ink-soft)" }}>Schedule routine field walkthrough.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: MARKET DECISION CENTER (PRESERVED) ==================== */
        <div>
          {/* Header with Crop Selector */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Harvest & Mandi Routing Advisory</h2>
              <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", marginTop: 2 }}>
                Net realization comparison after deducting freight, handling, and weather risk.
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
                Hold harvest 5–8 days to allow bulb/fruit sizing for higher Grade A price realization.
              </div>
            </div>

            <div className={`alt-card ${decision === "SWITCH" ? "selected" : ""}`}>
              {decision === "SWITCH" && <span className="picked-tag">AI TOP PICK</span>}
              <div className="alt-badge">
                <DecisionBadge decision="SWITCH" size="sm" />
              </div>
              <div className="alt-note">
                Reroute from local mandi to Lasalgaon APMC for +₹1.20/kg higher net realization after freight.
              </div>
            </div>
          </div>

          {/* Collapsible Net Realization Calculator */}
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 18px",
                borderRadius: 12,
                fontWeight: 700,
              }}
              onClick={() => setShowCalc(!showCalc)}
            >
              <span>View Transparent Mandi Price & Freight Breakdown</span>
              {showCalc ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showCalc && (
              <div style={{ marginTop: 14 }}>
                <NetRealizationCalculator
                  quantityKg={activeCrop?.quantityKg || 2400}
                  sellingPrice={activeCrop?.netRealization || 30}
                  transportCost={400}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Soil Form Modal */}
      <SoilFormModal
        isOpen={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        currentSoil={intelligence?.soil}
        farmerId={farmerId}
        onSaved={() => loadIntelligence()}
      />
    </div>
  );
}
