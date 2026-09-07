import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Store,
} from "lucide-react";
import marketIntelligenceApi from "../services/marketIntelligenceApi";
import type { MarketIntelligenceOverview } from "../services/marketIntelligenceApi";
import { cropOptions } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { LocationSelectorModal } from "../components/LocationSelectorModal";

export function MarketPage() {
  const { user } = useAuth();
  const { crops } = useAppState();
  const { t } = useLanguage();

  const availableCrops = useMemo(() => {
    const list = [...cropOptions];
    crops.forEach((c) => {
      if (!list.includes(c.name as any)) list.push(c.name as any);
    });
    return list;
  }, [crops]);

  const [selectedCrop, setSelectedCrop] = useState<string>(() => crops[0]?.name || "Tomato");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MANDI" | "BUYER" | "FPC">("ALL");
  const [quantityQuintals, setQuantityQuintals] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [overview, setOverview] = useState<MarketIntelligenceOverview | null>(null);

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocationStr = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict || "Set Location");

  const loadMarketData = async (crop: string, qty: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketIntelligenceApi.getOverview(crop, qty);
      setOverview(data);
    } catch (err: unknown) {
      console.warn("Market intelligence fetch warning:", err);
      // If error occurs, keep localized overview or set error
      if (!overview) {
        setError("Market data temporarily unavailable from live API.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData(selectedCrop, quantityQuintals);
  }, [selectedCrop, quantityQuintals]);

  // Derived opportunities list
  const baseRate = overview?.analytics?.current_modal_price || 2850;
  const opportunities = useMemo(() => {
    return [
      {
        id: 1,
        name: "Sahyadri Farmers Producer Co.",
        type: "FPC",
        typeLabel: "FPC Aggregator",
        verified: true,
        priceQtl: baseRate + 150,
        priceKg: (baseRate + 150) / 100,
        distanceKm: 16,
        freightQtl: 60,
        netRealizationQtl: baseRate + 150 - 60,
        netRealizationKg: (baseRate + 150 - 60) / 100,
        demand: "15 MT (Weekly procurement)",
        paymentTerms: "Same-Day Direct Bank Settlement",
        quality: "Grade A",
        rating: 4.9,
        isBest: true,
      },
      {
        id: 2,
        name: `${userDistrict} APMC Central Mandi`,
        type: "MANDI",
        typeLabel: "Regulated APMC",
        verified: true,
        priceQtl: baseRate,
        priceKg: baseRate / 100,
        distanceKm: 12,
        freightQtl: 110,
        netRealizationQtl: baseRate - 110 - 28,
        netRealizationKg: (baseRate - 110 - 28) / 100,
        demand: "Open Auction Daily",
        paymentTerms: "APMC Commission Agent Slip",
        quality: "All Grades",
        rating: 4.5,
        isBest: false,
      },
      {
        id: 3,
        name: "FreshFarm Retail Hypermarket",
        type: "BUYER",
        typeLabel: "Direct Retail Chain",
        verified: true,
        priceQtl: baseRate + 80,
        priceKg: (baseRate + 80) / 100,
        distanceKm: 22,
        freightQtl: 90,
        netRealizationQtl: baseRate + 80 - 90,
        netRealizationKg: (baseRate + 80 - 90) / 100,
        demand: "8 MT (Daily supply contract)",
        paymentTerms: "Escrow release within 24h",
        quality: "Grade A",
        rating: 4.7,
        isBest: false,
      },
      {
        id: 4,
        name: "MahaAgro Export Consortium",
        type: "BUYER",
        typeLabel: "Export Procurer",
        verified: true,
        priceQtl: baseRate + 250,
        priceKg: (baseRate + 250) / 100,
        distanceKm: 65,
        freightQtl: 220,
        netRealizationQtl: baseRate + 250 - 220,
        netRealizationKg: (baseRate + 250 - 220) / 100,
        demand: "25 MT (Export lot)",
        paymentTerms: "Instant Bank Transfer",
        quality: "Export Grade (Brix > 17°)",
        rating: 4.8,
        isBest: false,
      },
    ];
  }, [baseRate, userDistrict]);

  const filteredOpportunities = opportunities.filter((op) => {
    if (activeFilter !== "ALL" && op.type !== activeFilter) return false;
    if (searchTerm && !op.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="wrap" style={{ maxWidth: 960, paddingBottom: 60 }}>
      {/* 1. Header & Location */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "16px 0",
          borderBottom: "1px solid var(--line)",
          marginBottom: 18,
        }}
      >
        <div>
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
            }}
          >
            <MapPin size={18} color="var(--green-deep)" />
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>
              {t("market.title", "Marketplace near")} {userDistrict}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-deep)", textDecoration: "underline", marginLeft: 4 }}>
              {t("common.edit", "Change")}
            </span>
          </button>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
            Transparent price discovery & direct farmgate linkages
          </div>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => loadMarketData(selectedCrop, quantityQuintals)}
          disabled={loading}
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>{t("common.refresh", "Refresh Rates")}</span>
        </button>
      </div>

      {/* 2. Crop Selector Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
        {availableCrops.map((c) => {
          const isSelected = selectedCrop.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCrop(c)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: isSelected ? "2px solid var(--green-deep)" : "1px solid var(--line)",
                background: isSelected ? "var(--green-deep)" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "var(--ink)",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* 3. Search and Type Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={16} color="var(--ink-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${selectedCrop} buyers, FPCs, or mandis...`}
            className="form-control"
            style={{ paddingLeft: 36, minHeight: 40 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { id: "ALL", label: "All Nearby" },
            { id: "MANDI", label: "APMC Mandis" },
            { id: "BUYER", label: "Direct Buyers" },
            { id: "FPC", label: "FPCs" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: activeFilter === f.id ? "1.5px solid var(--navy)" : "1px solid var(--line)",
                background: activeFilter === f.id ? "var(--navy)" : "#FFFFFF",
                color: activeFilter === f.id ? "#FFFFFF" : "var(--ink-soft)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error and Retry State if API fails */}
      {error && (
        <div className="card card-pad mb-md" style={{ background: "#FFFBF7", border: "1.5px solid var(--terracotta)", borderRadius: 12 }}>
          <div className="flex flex-between flex-center flex-wrap gap-sm">
            <span style={{ color: "var(--terracotta)", fontWeight: 700, fontSize: 13.5 }}>{error}</span>
            <button className="btn btn-outline btn-sm" onClick={() => loadMarketData(selectedCrop, quantityQuintals)}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        </div>
      )}

      {/* 4. Best Opportunity Highlight Banner */}
      <div
        style={{
          background: "linear-gradient(90deg, #F5FAF6 0%, #EBF6EF 100%)",
          border: "1.5px solid #CDE6D6",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--green-deep)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ★ AI Recommended Best Selling Channel
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginTop: 2 }}>
            Sahyadri / Regional FPC Direct (+₹160/Qtl over local mandi)
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
            Direct farmgate pickup eliminates mandi cess & reduces transit damage loss.
          </div>
        </div>

        <Link to="/lots/create" className="btn btn-primary btn-sm">
          <span>{t("lots.create", "Create Harvest Lot")}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 5. Opportunity Cards List */}
      <div className="flex-col gap-md">
        {filteredOpportunities.map((op) => (
          <div
            key={op.id}
            style={{
              background: "#FFFFFF",
              border: op.isBest ? "1.5px solid var(--green-deep)" : "1px solid var(--line)",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              transition: "all 0.15s ease",
            }}
          >
            <div className="flex flex-between flex-center flex-wrap gap-sm mb-sm">
              <div className="flex flex-center gap-sm">
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>{op.name}</div>
                {op.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "var(--green-deep)", background: "rgba(23,107,69,0.08)", padding: "2px 7px", borderRadius: 4 }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-muted)", background: "var(--bg-soft)", padding: "2px 7px", borderRadius: 4 }}>
                  {op.typeLabel}
                </span>
              </div>

              <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
                📍 {op.distanceKm} km away from {userDistrict}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
                background: "var(--bg-warm)",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Gross Listed Price</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>₹{op.priceQtl.toLocaleString("en-IN")} / Qtl</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>₹{op.priceKg} / kg</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Est. Transport Cost</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>-₹{op.freightQtl} / Qtl</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Farmgate logistics</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Net In-Hand Realization</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--green-deep)" }}>₹{op.netRealizationQtl.toLocaleString("en-IN")} / Qtl</div>
                <div style={{ fontSize: 11, color: "var(--green-deep)", fontWeight: 700 }}>₹{op.netRealizationKg} / kg Net</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Payment Settlement</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{op.paymentTerms}</div>
              </div>
            </div>

            <div className="flex flex-between flex-center flex-wrap gap-sm">
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                <strong>Procurement Demand:</strong> {op.demand} · <strong>Quality:</strong> {op.quality}
              </div>

              <Link
                to="/lots/create"
                className={`btn ${op.isBest ? "btn-primary" : "btn-outline"} btn-sm`}
                style={{ padding: "8px 18px" }}
              >
                <span>Sell Lot to this Buyer</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <LocationSelectorModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  );
}

export default MarketPage;
