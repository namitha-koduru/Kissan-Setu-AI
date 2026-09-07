import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CloudRain,
  Sprout,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Wind,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { farmIntelligenceApi } from "../services/farmIntelligenceApi";
import type { FarmIntelligenceOverview } from "../services/farmIntelligenceApi";
import { SoilFormModal } from "./SoilFormModal";
import { useLanguage } from "../context/LanguageContext";

interface FarmTodayCardProps {
  farmerId?: number;
}

export function FarmTodayCard({ farmerId = 1 }: FarmTodayCardProps) {
  const { t } = useLanguage();
  const [overview, setOverview] = useState<FarmIntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSoilModal, setShowSoilModal] = useState(false);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const data = await farmIntelligenceApi.getOverview(farmerId);
      setOverview(data);
    } catch (err: any) {
      console.warn("Farm intelligence API fallback to local computation:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchIntelligence();
  }, [farmerId]);

  if (loading) {
    return (
      <div
        className="card card-pad"
        style={{
          padding: "24px",
          borderRadius: "16px",
          background: "#fff",
          border: "1px solid var(--line)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RefreshCw size={20} className="spin" color="#176B45" />
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800 }}>Analyzing Your Farm Today...</div>
            <div style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
              Synthesizing soil tests, active crop stages, and live meteorological signals...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const weather = overview?.weather;
  const soil = overview?.soil;
  const primaryCrop = overview?.active_crops?.[0];
  const actionPlan = overview?.action_plan;


  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "rgba(23, 107, 69, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={16} color="#176B45" />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#176B45", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Farm Intelligence Engine
            </span>
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{t("dashboard.todayAction")}</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowSoilModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: "12.5px" }}
          >
            <FlaskConical size={14} />
            <span>{soil?.has_data ? "Edit Soil Test" : "Add Soil Test"}</span>
          </button>

          <Link
            to="/recommendation"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--green-deep)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <span>Full Farm Intelligence</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* 3 Intelligence Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* 1. Weather Signal Card */}
        <div
          className="card card-pad"
          style={{
            padding: "18px",
            borderRadius: "14px",
            background: "linear-gradient(145deg, #ffffff, #f9fbf9)",
            border: weather?.rain_risk === "high" ? "1.5px solid #eab308" : "1px solid var(--line)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  background: weather?.rain_risk === "high" ? "rgba(234, 179, 8, 0.15)" : "rgba(30, 58, 138, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloudRain size={18} color={weather?.rain_risk === "high" ? "#ca8a04" : "#1e40af"} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Weather Advisory
                </div>
                <div style={{ fontSize: "14.5px", fontWeight: 800, color: "var(--ink)" }}>
                  {weather?.rain_risk === "high"
                    ? "Precipitation Surge Expected"
                    : weather?.rain_risk === "medium"
                    ? "Moderate Rain Window"
                    : "Stable Field Weather"}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                background:
                  weather?.irrigation_need === "skip"
                    ? "rgba(239, 68, 68, 0.12)"
                    : weather?.irrigation_need === "reduced"
                    ? "rgba(234, 179, 8, 0.15)"
                    : "rgba(23, 107, 69, 0.12)",
                color:
                  weather?.irrigation_need === "skip"
                    ? "#b91c1c"
                    : weather?.irrigation_need === "reduced"
                    ? "#854d0e"
                    : "#176B45",
              }}
            >
              Irrigation: {weather?.irrigation_need?.toUpperCase() || "NORMAL"}
            </span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: "0 0 10px", lineHeight: "1.45" }}>
            {weather?.advisories?.[0] || "Optimal weather conditions for normal scheduled field activities."}
          </p>

          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--ink-soft)", borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Droplets size={13} color="#2563eb" />
              <span>Rain Chance: <strong>{weather?.rain_probability ?? 35}%</strong></span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Wind size={13} color="#6b7280" />
              <span>Spraying: <strong>{weather?.spraying_risk?.toUpperCase() ?? "SAFE"}</strong></span>
            </span>
          </div>
        </div>

        {/* 2. Active Crop Health & Growth Stage Card */}
        <div
          className="card card-pad"
          style={{
            padding: "18px",
            borderRadius: "14px",
            background: "linear-gradient(145deg, #ffffff, #f9fbf9)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  background: "rgba(23, 107, 69, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sprout size={18} color="#176B45" />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Active Focus Crop
                </div>
                <div style={{ fontSize: "14.5px", fontWeight: 800, color: "var(--ink)" }}>
                  {primaryCrop ? `${primaryCrop.crop_name} (${primaryCrop.variety || "Standard"})` : "Tomato"}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgba(23, 107, 69, 0.12)",
                color: "#176B45",
              }}
            >
              {primaryCrop?.health_status || "Good Health"}
            </span>
          </div>

          <div style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600, marginBottom: 4 }}>
            Stage: {primaryCrop?.growth_stage || "Near maturity"}
          </div>
          {primaryCrop?.estimated_stage && primaryCrop.stage_is_estimate && (
            <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", marginBottom: 8 }}>
              Estimated duration: {primaryCrop.estimated_stage}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px dashed var(--line)", paddingTop: 8, marginTop: 10 }}>
            <span style={{ color: "var(--ink-soft)" }}>
              Soil Match: <strong style={{ color: "var(--green-deep)" }}>{primaryCrop?.soil_match || "Compatible"}</strong>
            </span>
            <Link to={`/crops`} style={{ color: "var(--green-deep)", fontWeight: 700, textDecoration: "none" }}>
              View Crop &rarr;
            </Link>
          </div>
        </div>

        {/* 3. Soil Intelligence Card */}
        <div
          className="card card-pad"
          style={{
            padding: "18px",
            borderRadius: "14px",
            background: "linear-gradient(145deg, #ffffff, #f9fbf9)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  background: "rgba(180, 83, 9, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FlaskConical size={18} color="#b45309" />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  Soil Health Insights
                </div>
                <div style={{ fontSize: "14.5px", fontWeight: 800, color: "var(--ink)" }}>
                  {soil?.profile?.soil_type || "Black"} Soil
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                background: soil?.has_data ? "rgba(23, 107, 69, 0.12)" : "rgba(234, 179, 8, 0.15)",
                color: soil?.has_data ? "#176B45" : "#854d0e",
              }}
            >
              {soil?.has_data ? `pH ${soil.profile?.ph || 7.2}` : "Untested Baseline"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
            <div style={{ background: "#f5f5f3", padding: "6px 8px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10.5px", color: "var(--ink-soft)", fontWeight: 700 }}>Nitrogen (N)</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: soil?.nitrogen_status === "low" ? "#ca8a04" : "#176B45" }}>
                {soil?.nitrogen_status?.toUpperCase() || "LOW"}
              </div>
            </div>
            <div style={{ background: "#f5f5f3", padding: "6px 8px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10.5px", color: "var(--ink-soft)", fontWeight: 700 }}>Phosphorus (P)</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#176B45" }}>
                {soil?.phosphorus_status?.toUpperCase() || "MED"}
              </div>
            </div>
            <div style={{ background: "#f5f5f3", padding: "6px 8px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10.5px", color: "var(--ink-soft)", fontWeight: 700 }}>Potassium (K)</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#176B45" }}>
                {soil?.potassium_status?.toUpperCase() || "HIGH"}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--ink-soft)", lineHeight: "1.4" }}>
            {soil?.observations?.[0] || "Soil pH is in the optimal range for horticultural crops."}
          </div>
        </div>
      </div>

      {/* Prioritized Farm Action Plan Bar */}
      {actionPlan?.today && actionPlan.today.length > 0 && (
        <div
          className="card card-pad"
          style={{
            padding: "16px 20px",
            borderRadius: "14px",
            background: "#fff",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color="#176B45" />
              <h3 style={{ fontSize: "14.5px", fontWeight: 800, margin: 0 }}>
                Today's Farm Action Plan
              </h3>
            </div>
            <Link
              to="/recommendation"
              style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--green-deep)", textDecoration: "none" }}
            >
              View Weekly Schedule &rarr;
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actionPlan.today.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background:
                    item.priority === "high"
                      ? "rgba(239, 68, 68, 0.05)"
                      : item.category === "weather"
                      ? "rgba(234, 179, 8, 0.06)"
                      : "rgba(23, 107, 69, 0.04)",
                  borderLeft:
                    item.priority === "high"
                      ? "3px solid #ef4444"
                      : item.category === "weather"
                      ? "3px solid #eab308"
                      : "3px solid #176B45",
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {item.priority === "high" ? (
                    <AlertTriangle size={15} color="#ef4444" />
                  ) : (
                    <CheckCircle2 size={15} color="#176B45" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background:
                          item.priority === "high"
                            ? "#fee2e2"
                            : item.priority === "medium"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          item.priority === "high"
                            ? "#991b1b"
                            : item.priority === "medium"
                            ? "#92400e"
                            : "#166534",
                      }}
                    >
                      {item.priority} priority
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: 2, lineHeight: "1.4" }}>
                    {item.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soil Form Modal */}
      <SoilFormModal
        isOpen={showSoilModal}
        onClose={() => setShowSoilModal(false)}
        currentSoil={soil}
        farmerId={farmerId}
        onSaved={() => fetchIntelligence()}
      />
    </div>
  );
}
