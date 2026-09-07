import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plus,
  ArrowRight,
  Package,
  Truck,
  Sparkles,
  CloudSun,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { LocationSelectorModal } from "../components/LocationSelectorModal";
import { weatherByLocation } from "../data/demo";

export function DashboardPage() {
  const { user } = useAuth();
  const { crops, lots, transaction } = useAppState();
  const { t } = useLanguage();

  const [selectedCropIndex, setSelectedCropIndex] = useState(0);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const hasCrops = crops.length > 0;
  const preferredCropsList: string[] = Array.isArray(user?.preferredCrops)
    ? (user.preferredCrops as string[])
    : typeof user?.preferredCrops === "string"
    ? [(user.preferredCrops as string)]
    : [];
  const profileCrops: string[] = preferredCropsList.filter(
    (pc: string) => !crops.some((c) => c.name.toLowerCase() === pc.toLowerCase())
  );
  const hasAnyCrops = crops.length > 0 || profileCrops.length > 0;
  const activeCrop = hasCrops ? (crops[selectedCropIndex] || crops[0]) : null;

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocationStr = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict || "Set Location");
  
  // Resolve localized weather
  const weather = weatherByLocation[userDistrict] || (user?.location && Object.keys(weatherByLocation).find((k) => user.location.toLowerCase().includes(k.toLowerCase())) ? weatherByLocation[Object.keys(weatherByLocation).find((k) => user.location.toLowerCase().includes(k.toLowerCase()))!] : null) || {
    location: userLocationStr,
    currentTempC: 31,
    condition: "Clear Skies",
    rainProbability: 20,
    humidity: 60,
    forecast: [],
    risk: "Low" as const,
    riskNote: `Seasonal conditions across ${userDistrict} are favorable for harvesting and mandi logistics.`,
    demo: false,
  };

  // Nearby opportunities calculated for active crop if present
  const basePrice = activeCrop ? (activeCrop.expectedPrice || 28) * 100 : 2800; // ₹/Qtl
  const cropName = activeCrop ? activeCrop.name : "Produce";

  const nearbyOpportunities = activeCrop ? [
    {
      name: `Regional Institutional FPC (${userDistrict} Hub)`,
      type: "Institutional Buyer",
      priceQtl: basePrice + 150,
      distanceKm: 18,
      freightQtl: 60,
      netRealizationQtl: basePrice + 150 - 60,
      arrivalVolume: "Direct Bank Settlement",
      quality: "Grade A",
      paymentSpeed: "Payment in 2 days",
      isBest: true,
    },
    {
      name: `${userDistrict} APMC Central Mandi`,
      type: "Mandi Benchmark",
      priceQtl: basePrice,
      distanceKm: 14,
      freightQtl: 110,
      netRealizationQtl: basePrice - 110 - 25,
      arrivalVolume: "Daily Open Auction",
      quality: "All Grades",
      paymentSpeed: "APMC Commission Agent Slip",
      isBest: false,
    },
    {
      name: "FreshFarm Retail Chain",
      type: "Direct Retailer",
      priceQtl: basePrice + 80,
      distanceKm: 24,
      freightQtl: 90,
      netRealizationQtl: basePrice + 80 - 90,
      arrivalVolume: "Scheduled Supply",
      quality: "Grade A",
      paymentSpeed: "24h Bank Transfer",
      isBest: false,
    },
  ] : [];

  const hasActiveDeal = transaction && transaction.quantityKg > 0;

  return (
    <div className="wrap" style={{ maxWidth: 960, paddingBottom: 60 }}>
      {/* 1. Header & Location Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 0 20px",
          borderBottom: "1px solid var(--line)",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
            {t("dashboard.greeting", "Good day")}, {user?.name?.split(" ")[0] || "Farmer"}
          </div>
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              marginTop: 2,
            }}
          >
            <MapPin size={18} color="var(--green-deep)" />
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>{userLocationStr}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", textDecoration: "underline", marginLeft: 4 }}>
              {t("common.edit", "Change")}
            </span>
          </button>
        </div>

        <div className="flex gap-sm">
          <Link
            to="/weather"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              background: "rgba(46,139,87,0.08)",
              border: "1px solid rgba(46,139,87,0.2)",
              color: "var(--green-deep)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <CloudSun size={16} />
            <span>{weather.currentTempC}°C · {weather.condition}</span>
          </Link>
          <Link to="/chat" className="btn btn-outline btn-sm" style={{ borderRadius: 20 }}>
            <Sparkles size={14} color="var(--green-deep)" />
            <span>{t("nav.askAi", "Ask AI Assistant")}</span>
          </Link>
        </div>
      </div>

      {/* 2. "YOUR CROPS" — Crop Selector */}
      <div className="mb-xl">
        <div className="flex flex-between flex-center mb-sm">
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {t("crops.myCrops", "Your Crops")}
          </div>
          <Link to="/crops/add" className="flex flex-center gap-xs text-sm fw-700" style={{ color: "var(--green-deep)" }}>
            <Plus size={14} />
            <span>{t("crops.addCrop", "Add Crop")}</span>
          </Link>
        </div>

        {!hasAnyCrops ? (
          <div
            className="card card-pad text-center"
            style={{ padding: "28px 16px", background: "var(--bg-warm)", border: "1.5px dashed var(--line-strong)", borderRadius: 14 }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>No crops added yet</div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 16px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
              Add your crop to enable localized price discovery, harvest predictions, and direct buyer bids near {userDistrict}.
            </p>
            <Link to="/crops/add" className="btn btn-primary btn-sm">
              <Plus size={15} /> {t("crops.addCrop", "Add Your First Crop")}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {crops.map((c, idx) => {
              const isSelected = idx === selectedCropIndex;
              return (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => setSelectedCropIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    borderRadius: 14,
                    border: isSelected ? "2px solid var(--green-deep)" : "1px solid var(--line)",
                    background: isSelected ? "#FFFFFF" : "var(--bg-warm)",
                    boxShadow: isSelected ? "0 4px 12px rgba(23,107,69,0.12)" : "none",
                    cursor: "pointer",
                    minWidth: 150,
                    textAlign: "left",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{c.icon || "🌱"}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{c.quantityKg || 500} kg ready</div>
                  </div>
                </button>
              );
            })}

            {profileCrops.map((pc) => (
              <Link
                key={pc}
                to={`/crops/add?crop=${encodeURIComponent(pc)}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 14,
                  border: "1.5px dashed var(--green-leaf)",
                  background: "#FAFCF9",
                  textDecoration: "none",
                  minWidth: 200,
                  textAlign: "left",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 24 }}>🌱</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{pc}</div>
                  <div style={{ fontSize: 11, color: "var(--green-deep)", fontWeight: 700 }}>
                    Cultivated crop · Add details to enable AI tracking
                  </div>
                </div>
              </Link>
            ))}

            <Link
              to="/crops/add"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 14,
                border: "1.5px dashed var(--line-strong)",
                background: "transparent",
                color: "var(--ink-soft)",
                fontSize: 13,
                fontWeight: 700,
                minWidth: 120,
                flexShrink: 0,
              }}
            >
              <Plus size={16} />
              <span>{t("common.add", "Add")}</span>
            </Link>
          </div>
        )}
      </div>

      {/* 3. "BEST PLACES TO SELL" — Ranked Opportunities */}
      <div className="mb-xl">
        <div className="flex flex-between flex-center mb-sm">
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t("market.title", "Best Places to Sell Near You")}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {hasCrops ? `Showing highest in-hand net realization for ${cropName} near ${userDistrict}` : `Add a crop to view buyers near ${userDistrict}`}
            </div>
          </div>
          <Link to="/market" className="flex flex-center gap-xs text-sm fw-700" style={{ color: "var(--green-deep)" }}>
            <span>{t("common.viewAll", "Compare All")}</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {!hasCrops ? (
          <div className="card card-pad text-center" style={{ padding: "24px 16px", background: "#FFFFFF", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              Please add a crop above to see nearby buyer opportunities and net realization comparisons.
            </div>
          </div>
        ) : (
          <div className="flex-col gap-sm">
            {nearbyOpportunities.map((op, i) => (
              <div
                key={op.name}
                style={{
                  background: "#FFFFFF",
                  border: op.isBest ? "1.5px solid var(--green-deep)" : "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  boxShadow: op.isBest ? "0 2px 8px rgba(23,107,69,0.08)" : "none",
                  position: "relative",
                }}
              >
                {op.isBest && (
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 18,
                      background: "var(--green-deep)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    ★ Best In-Hand Realization
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: op.isBest ? "rgba(23,107,69,0.1)" : "var(--bg-soft)",
                      color: op.isBest ? "var(--green-deep)" : "var(--navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>{op.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                      📍 {op.distanceKm} km away · Freight -₹{op.freightQtl}/Qtl · {op.paymentSpeed}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: op.isBest ? "var(--green-deep)" : "var(--navy)" }}>
                      ₹{op.netRealizationQtl.toLocaleString("en-IN")}
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)" }}> / Qtl Net</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                      Gross ₹{op.priceQtl.toLocaleString("en-IN")} / Qtl
                    </div>
                  </div>

                  <Link
                    to={`/lots/create?crop=${encodeURIComponent(cropName)}`}
                    className={`btn ${op.isBest ? "btn-primary" : "btn-outline"} btn-sm`}
                    style={{ borderRadius: 8, padding: "7px 14px" }}
                  >
                    <span>{t("lots.create", "Sell Lot")}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ACTIVE LOTS & DEALS SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Active Lots */}
        <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
          <div className="flex flex-between flex-center mb-sm">
            <div className="flex flex-center gap-xs">
              <Package size={17} color="var(--green-deep)" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {t("lots.title", "Active Harvest Lots")}
              </span>
            </div>
            <span className="badge-pill badge-high" style={{ fontSize: 11 }}>
              {lots.length} Open
            </span>
          </div>

          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
            {lots.length > 0
              ? `${lots[0].crop} (${lots[0].quantityKg} kg) is open for institutional buyer bidding.`
              : "No harvest lots active. Create a lot to receive verified buyer tenders."}
          </div>

          <div className="flex gap-sm">
            <Link to="/offers" className="btn btn-outline btn-sm flex-1">
              <span>{t("offers.title", "View Offers")}</span>
            </Link>
            <Link to="/lots/create" className="btn btn-primary btn-sm flex-1">
              <Plus size={14} />
              <span>{t("lots.create", "New Lot")}</span>
            </Link>
          </div>
        </div>

        {/* Active Transaction */}
        <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
          <div className="flex flex-between flex-center mb-sm">
            <div className="flex flex-center gap-xs">
              <Truck size={17} color="var(--green-deep)" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {t("transactions.title", "Active Deal Tracker")}
              </span>
            </div>
            <span className={`badge-pill ${hasActiveDeal ? "badge-medium" : "badge-low"}`} style={{ fontSize: 11 }}>
              {hasActiveDeal ? "In Progress" : "No Active Deals"}
            </span>
          </div>

          {hasActiveDeal ? (
            <>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700 }}>
                {transaction.buyerName} · {transaction.crop} ({transaction.quantityKg} kg)
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 12px" }}>
                Pickup scheduled · Agreed Value: ₹{(transaction.pricePerKg * transaction.quantityKg).toLocaleString("en-IN")}
              </div>
              <Link to="/transactions" className="btn btn-secondary btn-sm btn-block">
                <span>{t("transactions.timeline", "Track Deal & Receipt")}</span>
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
                When you accept a buyer offer, real-time logistics tracking and direct payment settlement appear here.
              </div>
              <Link to="/market" className="btn btn-outline btn-sm btn-block">
                <span>Explore Marketplace</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 5. Concised Farm Weather Advisory */}
      <div
        style={{
          background: "linear-gradient(90deg, #FFFDF8 0%, #F5FAF6 100%)",
          border: "1px solid #E2EADF",
          borderRadius: 14,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="flex flex-center gap-md">
          <div style={{ padding: 10, borderRadius: 10, background: "rgba(46,139,87,0.12)", color: "var(--green-deep)" }}>
            <CloudSun size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--navy)" }}>
              {t("weather.advisory", "Farm Weather Advisory")} · {userDistrict}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
              {weather.riskNote}
            </div>
          </div>
        </div>

        <Link to="/weather" className="btn btn-outline btn-sm" style={{ padding: "6px 12px", fontSize: 12 }}>
          <span>{t("weather.forecast5d", "7-Day Forecast")}</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <LocationSelectorModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  );
}

export default DashboardPage;
