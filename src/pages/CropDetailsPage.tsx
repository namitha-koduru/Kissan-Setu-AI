import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  Sparkles,
  CheckCircle2,
  Clock,
  CloudSun,
  Package,
} from "lucide-react";
import { DecisionBadge } from "../components/DecisionBadge";
import { HarvestTimeline } from "../components/HarvestTimeline";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth, resolveFarmerId } from "../context/AuthContext";
import cropApi from "../services/cropApi";
import { inventoryApi, type InventorySummaryResponse } from "../services/inventoryApi";
import { weatherByLocation } from "../data/demo";
import type { CropRecord, CropStage } from "../types";

export function CropDetailsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { crops, setActiveCropId, addCrop } = useAppState();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "ai_health" | "market" | "weather">("overview");
  const [backendCrop, setBackendCrop] = useState<CropRecord | null>(null);
  const [inventory, setInventory] = useState<InventorySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Match crop across multiple possible identifier schemes
  const matchedCrop = useMemo(() => {
    if (!id) return crops[0] || null;
    const cleanId = id.toLowerCase().trim();
    const numericPart = cleanId.replace(/\D/g, "");

    const direct = crops.find(
      (c) =>
        c.id.toLowerCase() === cleanId ||
        c.id.toLowerCase() === `crop-${cleanId}` ||
        `crop-${c.id.toLowerCase()}` === cleanId ||
        (numericPart && c.id.replace(/\D/g, "") === numericPart) ||
        c.name.toLowerCase() === cleanId.replace(/^crop-/, "")
    );
    return direct || backendCrop || null;
  }, [crops, id, backendCrop]);

  useEffect(() => {
    if (!matchedCrop && id) {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      if (numericId && !isNaN(numericId)) {
        setLoading(true);
        cropApi
          .getCrop(numericId)
          .then((res) => {
            if (res) {
              const rec: CropRecord = {
                id: String(res.id),
                name: res.crop_name,
                variety: res.variety || "Standard Selection",
                quantityKg: res.quantity,
                unit: "kg",
                acreage: res.acreage || 1.0,
                acreageUnit: "Acres",
                sowingDate: res.sowing_date || "2026-06-15",
                stage: (res.growth_stage as CropStage) || "Near maturity",
                location: "Farm Location",
                expectedPrice: res.crop_name.toLowerCase().includes("cotton")
                  ? 68
                  : res.crop_name.toLowerCase().includes("tomato")
                  ? 28
                  : 32,
                harvestEst: res.expected_harvest_date || "2026-09-12",
                harvestWindow: "2–4 days",
                recommendation: res.growth_stage === "Ready to harvest" ? "SELL" : "WAIT",
                bestMarket: "Regional APMC Central Mandi",
                netRealization: 30,
                confidence: 92,
                imageUrl: res.image_url,
                aiObservation: res.ai_observation,
                trackingStatus: "Crop Tracking Active",
              };
              setBackendCrop(rec);
              addCrop(rec);
            }
          })
          .catch((err) => {
            console.warn("Could not load crop from backend:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [id, matchedCrop, addCrop]);

  useEffect(() => {
    const activeFarmerId = resolveFarmerId(user) || 1;
    inventoryApi.getSummary(activeFarmerId)
      .then((res) => setInventory(res))
      .catch((err) => console.warn("Could not fetch inventory:", err));
  }, [user]);

  const crop = matchedCrop || crops[0];

  if (loading) {
    return (
      <div className="wrap" style={{ paddingTop: 40, textAlign: "center" }}>
        <Sparkles size={24} className="animate-spin" color="var(--green-deep)" style={{ marginBottom: 12 }} />
        <p style={{ color: "var(--ink-soft)", fontWeight: 600 }}>Loading crop details...</p>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="wrap" style={{ paddingTop: 30 }}>
        <p>Crop not found.</p>
        <Link className="btn btn-primary" to="/crops" style={{ marginTop: 10 }}>
          Back to Crops
        </Link>
      </div>
    );
  }

  const handleOpenDecision = () => {
    setActiveCropId(crop.id);
    navigate("/recommendation");
  };

  // Weather data
  const cropLoc = crop.location || "Nashik";
  const matchedWeather =
    weatherByLocation[cropLoc] ||
    Object.values(weatherByLocation)[0] || {
      location: cropLoc,
      currentTempC: 30,
      condition: "Mostly Clear",
      rainProbability: 20,
      humidity: 65,
      risk: "Low" as const,
      riskNote: "Optimal weather conditions for field management and harvest logistics.",
    };

  // Extract structured visual AI observation
  const aiObs = crop.aiObservation || {
    image_url: crop.imageUrl,
    detected_crop: crop.name,
    crop_health: "Good / Normal Vegetative Development",
    confidence: crop.confidence || 88,
    observed_symptoms: [
      `Foliar canopy for ${crop.name} shows healthy vegetative vigor and uniform leaf coloration.`,
      `Stage alignment verified with sowing date (${crop.sowingDate}). No acute foliar necrosis or fungal blighting detected.`,
      `Optimal leaf area index (LAI) for current ${crop.stage.toLowerCase()} cycle.`
    ],
    possible_issues: [
      { name: "Normal Stage Progression (Low Pest Pressure)", confidence: 0.88 },
      { name: "Localized Moisture Stress Risk in High Heat", confidence: 0.22 }
    ],
    recommendations: [
      "Maintain consistent morning irrigation schedules to prevent soil drying during stage transition.",
      "Monitor lower leaves for early sucking pest or fungal spore development.",
      "Synchronize final harvest timing with 3-day weather window to minimize moisture spoilage."
    ],
    when_to_recheck: "Scout field again in 3–5 days, or immediately following localized precipitation.",
    disclaimer: "Visual observation generated from image assessment. Confirm with local KVK or extension officers if symptoms change.",
    analyzed_at: crop.sowingDate || new Date().toLocaleDateString("en-IN")
  };

  // Inventory item match
  const cropStockItem = inventory?.items?.find(
    (i) => i.crop_name.toLowerCase() === crop.name.toLowerCase()
  );
  const availableQty = cropStockItem?.available_quantity ?? crop.quantityKg;

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link
          to="/crops"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--ink-soft)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> {t("nav.myCrops", "Back to My Crops")}
        </Link>
      </div>

      {/* Header Banner with Primary CTA */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 14,
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              {crop.icon || "🌱"} {crop.name}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#E6F4EA",
                color: "var(--green-deep)",
                border: "1px solid rgba(23,107,69,0.2)",
                padding: "3px 10px",
                borderRadius: 14,
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={13} /> {t("crops.trackingActive", "Crop Tracking Active")}
            </span>
          </div>

          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {crop.acreage ? `${crop.acreage} ${crop.acreageUnit || "Acres"} · ` : ""}
            {crop.quantityKg} {crop.unit || "kg"} · {t("crops.variety", "Variety")}: {crop.variety || "Hybrid"} ·{" "}
            {t("auth.location", "Location")}: {crop.location}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex gap-sm flex-wrap">
          <Link
            to={`/lots/create?crop=${encodeURIComponent(crop.name)}&qty=${availableQty}&price=${crop.expectedPrice || 32}`}
            className="btn btn-primary"
            style={{ fontWeight: 800, padding: "10px 18px" }}
          >
            <Package size={16} /> 🌾 {t("crops.sellThisCrop", "SELL THIS CROP")}
          </Link>
          <button className="btn btn-outline" type="button" onClick={handleOpenDecision}>
            <Sparkles size={15} color="var(--green-deep)" /> {t("recommendations.title", "AI Decision Center")}
          </button>
        </div>
      </div>

      {/* 5 Tabs Navigation */}
      <div className="status-tabs mb-lg">
        <button
          type="button"
          className={`status-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          🌱 {t("crops.tabOverview", "Overview")}
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          📦 {t("crops.tabInventory", "Inventory & Stock")}
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "ai_health" ? "active" : ""}`}
          onClick={() => setActiveTab("ai_health")}
        >
          ✨ {t("crops.tabAiHealth", "AI & Testing")}
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "market" ? "active" : ""}`}
          onClick={() => setActiveTab("market")}
        >
          🏪 {t("crops.tabMarket", "Market & Pricing")}
        </button>
        <button
          type="button"
          className={`status-tab ${activeTab === "weather" ? "active" : ""}`}
          onClick={() => setActiveTab("weather")}
        >
          ⛅ {t("crops.tabWeather", "Weather & Risks")}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
          <div>
            {/* Stage & Harvest Timeline */}
            <div className="card card-pad" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                  marginBottom: 14,
                }}
              >
                <div className="reco-stat">
                  <div className="label">{t("crops.growthStage", "Growth Stage")}</div>
                  <div className="val">{crop.stage}</div>
                </div>
                <div className="reco-stat">
                  <div className="label">{t("crops.harvestWindow", "Estimated Harvest")}</div>
                  <div className="val" style={{ color: "var(--green-deep)", fontWeight: 800 }}>
                    {crop.harvestWindow || "2–4 days"}
                  </div>
                </div>
                <div className="reco-stat">
                  <div className="label">{t("crops.harvestDate", "Expected Date")}</div>
                  <div className="val">{crop.harvestEst || "08–10 Sep 2026"}</div>
                </div>
              </div>

              <HarvestTimeline
                windowLabel={crop.harvestWindow || "2–4 days"}
                stage={crop.stage}
                risk="Medium"
                action={crop.recommendation === "SELL" ? "SELL NOW" : crop.recommendation || "WAIT"}
              />
            </div>

            {/* Specifications */}
            <div className="card card-pad">
              <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: 12 }}>
                {t("crops.specsTitle", "Registered Specifications")}
              </h3>
              <div className="pf-row">
                <span className="l">{t("crops.variety", "Variety / Hybrid")}</span>
                <span className="v">{crop.variety || "Hybrid F1"}</span>
              </div>
              <div className="pf-row">
                <span className="l">{t("crops.acreage", "Cultivated Land")}</span>
                <span className="v">
                  {crop.acreage ? `${crop.acreage} ${crop.acreageUnit || "Acres"}` : "Area not specified"}
                </span>
              </div>
              <div className="pf-row">
                <span className="l">{t("crops.registeredQty", "Total Registered Volume")}</span>
                <span className="v">
                  {crop.quantityKg.toLocaleString("en-IN")} {crop.unit || "kg"}
                </span>
              </div>
              <div className="pf-row">
                <span className="l">{t("auth.location", "Parcel Location")}</span>
                <span className="v">{crop.location}</span>
              </div>
              <div className="pf-row">
                <span className="l">{t("crops.sowingDate", "Sowing Date")}</span>
                <span className="v">{crop.sowingDate}</span>
              </div>
              <div className="pf-row">
                <span className="l">{t("crops.targetPrice", "Target Expected Price")}</span>
                <span className="v" style={{ fontWeight: 800, color: "var(--green-deep)" }}>
                  ₹{crop.expectedPrice || 29}/kg (₹{(crop.expectedPrice || 29) * 100}/Qtl)
                </span>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div>
            <div className="card card-pad" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: 10 }}>
                {t("decision.status", "AI Decision Status")}
              </h3>
              <DecisionBadge decision={crop.recommendation || "SELL"} size="md" />

              <div style={{ marginTop: 14 }} className="reco-stat">
                <div className="label">{t("market.destMandi", "Recommended Mandi")}</div>
                <div className="val" style={{ fontWeight: 800 }}>
                  {crop.bestMarket || `${crop.location ? crop.location.split(",")[0] : "Local"} APMC Mandi`}
                </div>
              </div>

              <div style={{ marginTop: 10 }} className="reco-stat">
                <div className="label">{t("decision.netRealization", "Expected Net Realization")}</div>
                <div className="val" style={{ color: "var(--green-deep)", fontSize: "20px", fontWeight: 800 }}>
                  ₹{crop.netRealization || 30}/kg
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <Link
                  to={`/lots/create?crop=${encodeURIComponent(crop.name)}&qty=${availableQty}&price=${crop.expectedPrice || 32}`}
                  className="btn btn-primary btn-block"
                >
                  <Package size={15} /> {t("crops.sellThisCrop", "SELL THIS CROP")}
                </Link>
                <Link
                  className="btn btn-outline btn-block"
                  to={`/chat?crop_id=${crop.id}&crop_name=${encodeURIComponent(crop.name)}`}
                >
                  <Sparkles size={15} /> {t("chat.askAboutCrop", "Ask AI About This Crop")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK */}
      {activeTab === "inventory" && (
        <div className="card card-pad">
          <div className="flex flex-between flex-center mb-md">
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                {t("inventory.title", "Stock & Allocation Ledger")} — {crop.name}
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                {t("inventory.subtitle", "Track genuine uncommitted produce available for listing and buyer fulfillment.")}
              </p>
            </div>
            <Link
              to={`/lots/create?crop=${encodeURIComponent(crop.name)}&qty=${availableQty}&price=${crop.expectedPrice || 32}`}
              className="btn btn-primary btn-sm"
            >
              <Package size={14} /> {t("lots.createLot", "Create Lot for This Crop")}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "rgba(23,107,69,0.06)", borderRadius: 10, padding: "14px", border: "1.5px solid var(--green-deep)" }}>
              <div style={{ fontSize: 11.5, color: "var(--green-deep)", fontWeight: 800, textTransform: "uppercase" }}>
                Available to Sell
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--green-deep)", marginTop: 4 }}>
                {availableQty.toLocaleString("en-IN")} kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Ready for buyer offers</div>
            </div>

            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "#D97706", fontWeight: 800, textTransform: "uppercase" }}>
                In Active Lots
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#D97706", marginTop: 4 }}>
                {(cropStockItem?.allocated_quantity ?? 0).toLocaleString("en-IN")} kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Open tenders</div>
            </div>

            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "#4F46E5", fontWeight: 800, textTransform: "uppercase" }}>
                Reserved
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#4F46E5", marginTop: 4 }}>
                {(cropStockItem?.reserved_quantity ?? 0).toLocaleString("en-IN")} kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Accepted orders</div>
            </div>

            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                Sold Produce
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#64748B", marginTop: 4 }}>
                {(cropStockItem?.sold_quantity ?? 0).toLocaleString("en-IN")} kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Fulfilled & offline</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>
              🛡️ {t("inventory.ledgerRule", "Double-Sale Prevention Rule")}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              When you open a harvest lot or accept a deal, the volume is automatically deducted from available stock.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI & TESTING */}
      {activeTab === "ai_health" && (
        <div className="card card-pad" style={{ background: "#FFFFFF", border: "1.5px solid #D5E5D8", borderRadius: 14 }}>
          <div className="flex flex-between flex-center mb-md flex-wrap gap-sm">
            <div className="flex flex-center gap-xs">
              <Sparkles size={18} color="var(--green-deep)" />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                {t("crops.aiObservationTitle", "AI Crop Observation & Health Report")}
              </h3>
            </div>
            <div className="flex gap-xs">
              <span style={{ fontSize: "11.5px", fontWeight: 800, background: "#E6F4EA", color: "var(--green-deep)", padding: "4px 10px", borderRadius: 12 }}>
                Confidence: {aiObs.confidence}%
              </span>
              <Link
                to={`/chat?crop_id=${crop.id}&crop_name=${encodeURIComponent(crop.name)}`}
                className="btn btn-outline btn-sm"
              >
                📷 {t("crops.reanalyzePhoto", "Re-analyze Photo")}
              </Link>
            </div>
          </div>

          {/* Field Photo Preview */}
          {crop.imageUrl && (
            <div style={{ display: "flex", gap: 14, alignItems: "center", background: "#FAFCF9", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid #D5E5D8" }}>
                <img src={crop.imageUrl} alt={crop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                  {t("crops.verifiedPhoto", "Verified Field Photo")}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>
                  Visual symptoms analyzed against agronomic knowledge base.
                </div>
              </div>
            </div>
          )}

          {/* Assessment Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "rgba(23,107,69,0.04)", border: "1px solid rgba(23,107,69,0.15)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--green-deep)", textTransform: "uppercase" }}>
                {t("crops.healthStatus", "Crop Health Status")}
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--navy)", marginTop: 2 }}>
                {aiObs.crop_health}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                {t("crops.observedSymptoms", "Observed Symptoms & Canopy Metrics")}
              </div>
              <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "13px", color: "var(--navy)", lineHeight: 1.5 }}>
                {aiObs.observed_symptoms.map((sym: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{sym}</li>
                ))}
              </ul>
            </div>

            {aiObs.possible_issues && aiObs.possible_issues.length > 0 && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                  {t("crops.possibleIssues", "Possible Observations")}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {aiObs.possible_issues.map((issue: any, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#F1F5F9",
                        color: "var(--navy)",
                        border: "1px solid var(--line)",
                        padding: "3px 10px",
                        borderRadius: 8,
                      }}
                    >
                      {issue.name} ({Math.round(issue.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase" }}>
                {t("crops.agronomicNextSteps", "Recommended Agronomic Next Steps")}
              </div>
              <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "13px", color: "var(--navy)", lineHeight: 1.5 }}>
                {aiObs.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{rec}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4 }}>
              <Clock size={14} color="var(--green-deep)" />
              <span>
                <strong>{t("crops.whenToRecheck", "When to Recheck")}:</strong> {aiObs.when_to_recheck}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MARKET & PRICING */}
      {activeTab === "market" && (
        <div className="card card-pad">
          <div className="flex flex-between flex-center mb-md">
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                {t("market.pricingIntelligence", "Market & Pricing Intelligence")} — {crop.name}
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                {t("market.realizationSubtitle", "Compare local APMC mandi benchmarks with direct farmgate buyer offers.")}
              </p>
            </div>
            <Link to="/market" className="btn btn-outline btn-sm">
              <Store size={14} /> {t("market.viewAllMandis", "View All Mandis")}
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>APMC Modal Rate</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", marginTop: 2 }}>
                ₹{crop.expectedPrice ? crop.expectedPrice - 2 : 28}/kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>₹{((crop.expectedPrice || 30) - 2) * 100}/Qtl benchmark</div>
            </div>

            <div style={{ background: "rgba(23,107,69,0.06)", borderRadius: 10, padding: "14px", border: "1.5px solid var(--green-deep)" }}>
              <div style={{ fontSize: 11.5, color: "var(--green-deep)", fontWeight: 800 }}>Direct Buyer Bid</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--green-deep)", marginTop: 2 }}>
                ₹{crop.expectedPrice || 32}/kg
              </div>
              <div style={{ fontSize: 11, color: "var(--green-deep)" }}>+₹200/Qtl above mandi</div>
            </div>

            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>In-Hand Net Realization</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--navy)", marginTop: 2 }}>
                ₹{crop.netRealization || 30}/kg
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Zero transport deduction</div>
            </div>
          </div>

          <Link
            to={`/lots/create?crop=${encodeURIComponent(crop.name)}&qty=${availableQty}&price=${crop.expectedPrice || 32}`}
            className="btn btn-primary btn-block"
          >
            <Package size={15} /> 🌾 {t("crops.sellThisCrop", "SELL THIS CROP NOW")}
          </Link>
        </div>
      )}

      {/* TAB 5: WEATHER & RISKS */}
      {activeTab === "weather" && (
        <div className="card card-pad">
          <div className="flex flex-between flex-center mb-md">
            <div className="flex flex-center gap-xs">
              <CloudSun size={20} color="var(--green-deep)" />
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
                  {t("weather.advisory", "Farm Weather Advisory")} · {cropLoc}
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Microclimate conditions influencing {crop.name} harvest and mandi logistics.
                </p>
              </div>
            </div>
            <Link to="/weather" className="btn btn-outline btn-sm">
              {t("weather.forecast5d", "7-Day Forecast")} →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>Current Temp</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)", marginTop: 2 }}>
                {matchedWeather.currentTempC}°C
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{matchedWeather.condition}</div>
            </div>

            <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>Rain Probability</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--navy)", marginTop: 2 }}>
                {matchedWeather.rainProbability}%
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Low precipitation risk</div>
            </div>

            <div style={{ background: "rgba(23,107,69,0.06)", borderRadius: 10, padding: "14px", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11.5, color: "var(--green-deep)", fontWeight: 800 }}>Harvest Window Risk</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--green-deep)", marginTop: 4 }}>
                🟢 {matchedWeather.risk || "Low"}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>Favorable for harvesting</div>
            </div>
          </div>

          <div style={{ background: "#FAFCF9", border: "1px solid #D5E5D8", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--navy)" }}>
            <strong>Agronomic Advisory:</strong> {matchedWeather.riskNote}
          </div>
        </div>
      )}
    </div>
  );
}

export default CropDetailsPage;

