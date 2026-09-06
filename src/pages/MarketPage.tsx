import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Store,
  Calculator,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import marketIntelligenceApi from "../services/marketIntelligenceApi";
import type {
  MarketIntelligenceOverview,
  NetRealizationBreakdown,
} from "../services/marketIntelligenceApi";
import { cropOptions } from "../data/demo";

export function MarketPage() {
  const navigate = useNavigate();
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [quantityQuintals, setQuantityQuintals] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "compare" | "forecast" | "calculator" | "buyers">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Loaded State
  const [overview, setOverview] = useState<MarketIntelligenceOverview | null>(null);

  // Calculator State
  const [calcDistance, setCalcDistance] = useState<number>(45);
  const [calcGrossPrice, setCalcGrossPrice] = useState<number>(3100);
  const [calcTransportRate, setCalcTransportRate] = useState<number>(3.5);
  const [calcStorageDays, setCalcStorageDays] = useState<number>(0);
  const [calcLossPercent, setCalcLossPercent] = useState<number>(1.5);
  const [calcResult, setCalcResult] = useState<NetRealizationBreakdown | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  // Fetch Overview Data
  const loadMarketData = async (crop: string, qty: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketIntelligenceApi.getOverview(crop, qty);
      setOverview(data);
      if (data.comparison && data.comparison.markets.length > 0) {
        setCalcGrossPrice(data.comparison.markets[0].gross_price_per_quintal);
        setCalcDistance(data.comparison.markets[0].distance_km);
      }
    } catch (err: unknown) {
      console.error("Error fetching market intelligence:", err);
      setError("Failed to load market intelligence data. Please check your network or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData(selectedCrop, quantityQuintals);
  }, [selectedCrop, quantityQuintals]);

  // Recalculate Custom Net Realization
  const handleRecalculate = async () => {
    try {
      setCalcLoading(true);
      const res = await marketIntelligenceApi.calculateNetRealization({
        crop_name: selectedCrop,
        quantity_quintals: quantityQuintals,
        gross_price_per_quintal: calcGrossPrice,
        distance_km: calcDistance,
        transport_rate_per_km_quintal: calcTransportRate,
        storage_days: calcStorageDays,
        loss_percentage: calcLossPercent,
      });
      setCalcResult(res);
    } catch (err) {
      console.error("Calculation failed", err);
    } finally {
      setCalcLoading(false);
    }
  };

  // Prepare Chart Data combining Historical and Forecast
  const prepareChartData = () => {
    if (!overview) return [];
    const history = overview.analytics.history_points.map((p) => ({
      date: p.date.substring(5), // MM-DD
      modal_price: p.modal_price,
      type: "Historical",
      mandi: p.mandi_name || "Mandi",
    }));

    const forecast = overview.forecast.forecast_points.map((p) => ({
      date: p.date.substring(5),
      expected_price: p.expected_price,
      min_expected: p.min_expected,
      max_expected: p.max_expected,
      type: "Forecast",
    }));

    return [...history, ...forecast];
  };

  const chartPoints = prepareChartData();

  return (
    <div className="wrap">
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "20px 0 14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                background: "var(--green-soft)",
                color: "var(--green-deep)",
                padding: "3px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
              }}
            >
              Phase 5 Engine
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0 }}>
              Market Intelligence & Price Discovery
            </h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            Maximize your expected <strong>Net Realization</strong> (Gross revenue minus freight, mandi cess, handling, and storage).
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>Crop:</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--line-strong)",
                fontWeight: 700,
                backgroundColor: "#fff",
              }}
            >
              {cropOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>Quantity:</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="number"
                value={quantityQuintals}
                min={1}
                max={500}
                onChange={(e) => setQuantityQuintals(Math.max(1, Number(e.target.value)))}
                style={{
                  width: "70px",
                  padding: "8px 10px",
                  borderRadius: "8px 0 0 8px",
                  border: "1px solid var(--line-strong)",
                  fontWeight: 700,
                }}
              />
              <span
                style={{
                  background: "#F1F5F0",
                  border: "1px solid var(--line-strong)",
                  borderLeft: "none",
                  padding: "8px 10px",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink-soft)",
                }}
              >
                Qtl ({quantityQuintals * 100} kg)
              </span>
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => loadMarketData(selectedCrop, quantityQuintals)}
            style={{ padding: "8px 12px" }}
            title="Refresh Market Data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-row" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Sparkles size={15} /> Strategy & Decision
        </button>
        <button
          className={`tab-btn ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => setActiveTab("compare")}
        >
          <Store size={15} /> Mandi Net Comparison
        </button>
        <button
          className={`tab-btn ${activeTab === "forecast" ? "active" : ""}`}
          onClick={() => setActiveTab("forecast")}
        >
          <TrendingUp size={15} /> Price Forecast (7-Day)
        </button>
        <button
          className={`tab-btn ${activeTab === "calculator" ? "active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          <Calculator size={15} /> Net Calculator
        </button>
        <button
          className={`tab-btn ${activeTab === "buyers" ? "active" : ""}`}
          onClick={() => setActiveTab("buyers")}
        >
          <Users size={15} /> Verified Buyer Leads ({overview?.buyer_opportunities.opportunities_count || 0})
        </button>
      </div>

      {loading && !overview && (
        <div className="card card-pad" style={{ textAlign: "center", padding: "40px" }}>
          <RefreshCw size={32} className="animate-spin" color="var(--green-deep)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Calculating Net Realization & Multi-Mandi Analytics...</h3>
          <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>Analyzing distance freight, handling fees, and price trajectories.</p>
        </div>
      )}

      {error && (
        <div className="card card-pad" style={{ background: "#FDF2F2", border: "1px solid #F8D7DA", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#721C24" }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Error Loading Data:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {overview && (
        <>
          {/* TAB 1: OVERVIEW & DECISION */}
          {activeTab === "overview" && (
            <div>
              {/* Decision Hero Banner */}
              <div
                className="card card-pad"
                style={{
                  background:
                    overview.decision.recommendation === "SELL"
                      ? "linear-gradient(135deg, #176B45 0%, #0F492E 100%)"
                      : overview.decision.recommendation === "WAIT"
                      ? "linear-gradient(135deg, #9C5100 0%, #613200 100%)"
                      : "linear-gradient(135deg, #155724 0%, #1A4D2E 100%)",
                  color: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "24px 28px",
                  marginBottom: 20,
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.5px",
                        }}
                      >
                        AI RECOMMENDATION
                      </span>
                      <span style={{ fontSize: "13px", opacity: 0.9 }}>
                        Urgency: <strong>{overview.decision.urgency}</strong> · Confidence: <strong>{overview.decision.confidence_score}%</strong>
                      </span>
                    </div>

                    <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "4px 0 10px" }}>
                      {overview.decision.recommendation} NOW — {overview.decision.recommended_mandi}
                    </h2>

                    <p style={{ fontSize: "15px", opacity: 0.95, maxWidth: "700px", lineHeight: 1.5 }}>
                      {overview.decision.action_summary}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      textAlign: "right",
                      minWidth: "220px",
                    }}
                  >
                    <div style={{ fontSize: "12px", opacity: 0.85, marginBottom: 4 }}>Expected Net In-Hand</div>
                    <div style={{ fontSize: "32px", fontWeight: 900 }}>
                      ₹{overview.decision.expected_net_per_kg.toFixed(2)}<span style={{ fontSize: "18px" }}>/kg</span>
                    </div>
                    <div style={{ fontSize: "12.5px", opacity: 0.9, marginTop: 4 }}>
                      Total: ₹{((overview.decision.expected_net_per_kg * quantityQuintals * 100)).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Key Decision Pillars */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                    marginTop: 20,
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                    paddingTop: 16,
                  }}
                >
                  <div style={{ background: "rgba(0, 0, 0, 0.15)", padding: "10px 14px", borderRadius: 8 }}>
                    <div style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>Price Trend Factor</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: 2 }}>{overview.decision.price_trend_factor}</div>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.15)", padding: "10px 14px", borderRadius: 8 }}>
                    <div style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>Weather Risk Impact</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: 2 }}>{overview.decision.weather_factor}</div>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.15)", padding: "10px 14px", borderRadius: 8 }}>
                    <div style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>Storage Viability</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: 2 }}>{overview.decision.storage_viability}</div>
                  </div>
                </div>
              </div>

              {/* Net vs Gross Mandi Ranking Snapshot */}
              <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 20 }}>
                {/* Mandi Cards */}
                <div className="card card-pad">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Top Mandi Realization Comparison</h3>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                      onClick={() => setActiveTab("compare")}
                    >
                      View Full Table →
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {overview.comparison.markets.slice(0, 3).map((m) => (
                      <div
                        key={m.mandi_id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: m.is_best_net ? "2px solid var(--green-deep)" : "1px solid var(--line)",
                          background: m.is_best_net ? "#F4FAF5" : "#FFFFFF",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong>{m.mandi_name}</strong>
                            <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>({m.distance_km} km)</span>
                            {m.is_best_net && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  background: "var(--green-deep)",
                                  color: "#fff",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                Best Net Return
                              </span>
                            )}
                            {m.is_highest_gross && !m.is_best_net && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: "#FFE082",
                                  color: "#5D4037",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                Highest Gross Rate
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 4 }}>
                            Gross: ₹{m.gross_price_per_kg.toFixed(2)}/kg · Transport: -₹{m.transport_cost_per_kg.toFixed(2)}/kg · Fees: -₹{m.handling_and_fees_per_kg.toFixed(2)}/kg
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: m.is_best_net ? "var(--green-deep)" : "var(--ink)" }}>
                            ₹{m.net_realization_per_kg.toFixed(2)}/kg
                          </div>
                          <div style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>
                            Total Net: ₹{m.net_realization_total.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: "#F8FAF7",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #E2E8DF",
                      fontSize: "12.5px",
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <Info size={16} color="var(--green-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{overview.comparison.net_vs_gross_insight}</span>
                  </div>
                </div>

                {/* Direct Buyer Matches Snapshot */}
                <div className="card card-pad">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Direct Buyer Opportunities</h3>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                      onClick={() => setActiveTab("buyers")}
                    >
                      All Leads ({overview.buyer_opportunities.opportunities_count}) →
                    </button>
                  </div>

                  {overview.buyer_opportunities.opportunities.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--ink-soft)", fontSize: "13px" }}>
                      No direct buyer demands open for {selectedCrop} currently.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {overview.buyer_opportunities.opportunities.slice(0, 2).map((b) => (
                        <div
                          key={b.buyer_id}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid var(--line)",
                            background: "#FAFAFA",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong>{b.buyer_name}</strong>
                                {b.is_verified && <CheckCircle2 size={14} color="#176B45" />}
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                                {b.company_name || b.location} · Needs {b.quantity_required_quintals} Qtl
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--green-deep)" }}>
                                ₹{b.offered_price_per_kg.toFixed(2)}/kg
                              </div>
                              <div style={{ fontSize: "11px", color: "#B06000", fontWeight: 700 }}>
                                +₹{b.net_advantage_per_kg.toFixed(2)}/kg vs mandi
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Terms: {b.payment_terms}</span>
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() => navigate(`/lots/create?crop=${encodeURIComponent(selectedCrop)}&qty=${quantityQuintals * 100}&price=${b.offered_price_per_kg}`)}
                            >
                              Create Matching Lot
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <Link
                      to={`/chat?q=${encodeURIComponent(`What is the best selling strategy for my ${quantityQuintals} quintals of ${selectedCrop}?`)}`}
                      className="btn btn-secondary btn-block"
                      style={{ fontSize: "13px", gap: 6, justifyContent: "center" }}
                    >
                      <Sparkles size={15} /> Ask AI Selling Strategy
                    </Link>
                  </div>
                </div>
              </div>

              {/* Price Trend Chart Preview */}
              <div className="card card-pad" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Historical & Predictive Price Trajectory</h3>
                    <p style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
                      Current Modal: <strong>₹{overview.analytics.current_modal_price}/quintal</strong> (₹{(overview.analytics.current_modal_price / 100).toFixed(2)}/kg) · Trend: <strong>{overview.analytics.trend_direction}</strong>
                    </p>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                    onClick={() => setActiveTab("forecast")}
                  >
                    View Forecast Details →
                  </button>
                </div>

                <div style={{ height: 260, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#176B45" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#176B45" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#EEF1EA" vertical={false} />
                      <XAxis dataKey="date" stroke="#88988E" fontSize={12} tickLine={false} />
                      <YAxis stroke="#88988E" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val: unknown) => {
                          const n = typeof val === "number" ? val : Number(val);
                          return [`₹${n.toFixed(0)}/Qtl (₹${(n / 100).toFixed(1)}/kg)`, "Price"];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="modal_price"
                        stroke="#176B45"
                        strokeWidth={2.5}
                        fill="url(#colorPrice)"
                        name="Historical Modal"
                      />
                      <Area
                        type="monotone"
                        dataKey="expected_price"
                        stroke="#E88922"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        fill="none"
                        name="Forecast"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-MARKET COMPARISON */}
          {activeTab === "compare" && (
            <div>
              <div className="card card-pad" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 900 }}>
                      Mandi Net Realization Ranking ({selectedCrop} · {quantityQuintals} Quintals)
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 2 }}>
                      Ranked strictly by <strong>Net Realization</strong> (Gross price minus freight, handling, and market fees).
                    </p>
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank & Mandi</th>
                        <th>Distance</th>
                        <th>Gross Price</th>
                        <th>Freight Deduct</th>
                        <th>Mandi & Handling</th>
                        <th>Net Realization (kg)</th>
                        <th>Total In-Hand (₹)</th>
                        <th>Net Advantage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.comparison.markets.map((m, idx) => (
                        <tr key={m.mandi_id} className={m.is_best_net ? "highlight" : ""}>
                          <td data-label="Mandi">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontWeight: 800, color: "var(--ink-soft)", width: "18px" }}>#{idx + 1}</span>
                              <strong>{m.mandi_name}</strong>
                              {m.is_best_net && (
                                <span style={{ fontSize: "11px", fontWeight: 800, background: "var(--green-deep)", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>
                                  ★ Best Net
                                </span>
                              )}
                              {m.is_highest_gross && !m.is_best_net && (
                                <span style={{ fontSize: "11px", fontWeight: 700, background: "#FFF3CD", color: "#856404", padding: "2px 6px", borderRadius: 4 }}>
                                  High Gross
                                </span>
                              )}
                            </div>
                          </td>
                          <td data-label="Distance">{m.distance_km} km</td>
                          <td data-label="Gross Price">
                            <strong>₹{m.gross_price_per_kg.toFixed(2)}/kg</strong>
                            <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>₹{m.gross_price_per_quintal}/Qtl</div>
                          </td>
                          <td data-label="Freight" style={{ color: "var(--danger)" }}>
                            -₹{m.transport_cost_per_kg.toFixed(2)}/kg
                          </td>
                          <td data-label="Fees" style={{ color: "var(--danger)" }}>
                            -₹{m.handling_and_fees_per_kg.toFixed(2)}/kg
                          </td>
                          <td data-label="Net Realization" style={{ fontWeight: 900, fontSize: "15px", color: m.is_best_net ? "var(--green-deep)" : "inherit" }}>
                            ₹{m.net_realization_per_kg.toFixed(2)}/kg
                          </td>
                          <td data-label="Total In-Hand" style={{ fontWeight: 800 }}>
                            ₹{m.net_realization_total.toLocaleString("en-IN")}
                          </td>
                          <td data-label="Advantage">
                            {m.advantage_vs_local_total > 0 ? (
                              <span style={{ color: "var(--green-deep)", fontWeight: 700 }}>
                                +₹{m.advantage_vs_local_total.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span style={{ color: "var(--ink-soft)" }}>Baseline</span>
                            )}
                          </td>
                          <td data-label="Action">
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: "11.5px", padding: "4px 8px" }}
                              onClick={() => navigate(`/lots/create?crop=${encodeURIComponent(selectedCrop)}&qty=${quantityQuintals * 100}&price=${m.gross_price_per_kg}`)}
                            >
                              Sell Here
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICE FORECAST & ANALYTICS */}
          {activeTab === "forecast" && (
            <div>
              <div className="card card-pad" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 900 }}>
                      7-Day Price Forecast & Trend Trajectory — {selectedCrop}
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 2 }}>
                      Trend Direction: <strong>{overview.forecast.trend_direction}</strong> · Volatility: <strong>{overview.analytics.volatility_level}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ height: 300, width: "100%", marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#EEF1EA" vertical={false} />
                      <XAxis dataKey="date" stroke="#88988E" fontSize={12} tickLine={false} />
                      <YAxis stroke="#88988E" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val: unknown) => {
                          const n = typeof val === "number" ? val : Number(val);
                          return [`₹${n.toFixed(0)}/Qtl (₹${(n / 100).toFixed(1)}/kg)`, "Expected"];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="modal_price"
                        stroke="#176B45"
                        strokeWidth={2.5}
                        fill="#176B45"
                        fillOpacity={0.15}
                        name="Historical Modal"
                      />
                      <Area
                        type="monotone"
                        dataKey="max_expected"
                        stroke="#A8D5BA"
                        strokeDasharray="2 2"
                        fill="#A8D5BA"
                        fillOpacity={0.1}
                        name="Upper Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="expected_price"
                        stroke="#E88922"
                        strokeWidth={2.5}
                        fill="none"
                        name="Forecast Trajectory"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast Table */}
                <div className="table-scroll" style={{ marginBottom: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Timeline</th>
                        <th>Expected Modal Price</th>
                        <th>Confidence Range (Min – Max)</th>
                        <th>Confidence Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.forecast.forecast_points.map((p) => (
                        <tr key={p.date}>
                          <td data-label="Date"><strong>{p.date}</strong></td>
                          <td data-label="Timeline">Day +{p.day_offset}</td>
                          <td data-label="Expected Price" style={{ fontWeight: 800, color: "var(--green-deep)" }}>
                            ₹{p.expected_price}/Qtl (₹{(p.expected_price / 100).toFixed(2)}/kg)
                          </td>
                          <td data-label="Range">₹{p.min_expected} – ₹{p.max_expected}/Qtl</td>
                          <td data-label="Confidence">{p.confidence_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Drivers & Limitations Disclaimer */}
                <div className="grid-2" style={{ gap: 14 }}>
                  <div style={{ background: "#F4FAF5", padding: "14px", borderRadius: 8, border: "1px solid #D1E7DD" }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--green-deep)", marginBottom: 6 }}>
                      Key Market Drivers
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: "12.5px", color: "var(--ink-mid)" }}>
                      {overview.forecast.key_drivers.map((d, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: "#FFF8E1", padding: "14px", borderRadius: 8, border: "1px solid #FFE082" }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#795548", marginBottom: 6 }}>
                      Transparent Model Disclaimer
                    </div>
                    <p style={{ fontSize: "12px", color: "#5D4037", margin: 0, lineHeight: 1.4 }}>
                      {overview.forecast.limitations_disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE NET REALIZATION CALCULATOR */}
          {activeTab === "calculator" && (
            <div>
              <div className="card card-pad" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Calculator size={20} color="var(--green-deep)" />
                  <h2 style={{ fontSize: "18px", fontWeight: 900 }}>
                    Custom Net Realization Calculator
                  </h2>
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div className="field">
                    <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Mandi Gross Price (₹/Quintal)</label>
                    <input
                      type="number"
                      value={calcGrossPrice}
                      onChange={(e) => setCalcGrossPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Distance to Mandi (km)</label>
                    <input
                      type="number"
                      value={calcDistance}
                      onChange={(e) => setCalcDistance(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Transport Rate (₹/km/quintal)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcTransportRate}
                      onChange={(e) => setCalcTransportRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Holding / Storage Days</label>
                    <input
                      type="number"
                      value={calcStorageDays}
                      onChange={(e) => setCalcStorageDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Handling & Spoilage Loss (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcLossPercent}
                      onChange={(e) => setCalcLossPercent(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleRecalculate} disabled={calcLoading}>
                    {calcLoading ? "Calculating..." : "Compute Custom Net Breakdown"}
                  </button>
                </div>

                {calcResult && (
                  <div
                    style={{
                      background: "#FAFCF9",
                      border: "1px solid #D8E4D5",
                      borderRadius: "12px",
                      padding: "18px 22px",
                      marginTop: 18,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Calculation Results for {calcResult.quantity_quintals} Qtl ({calcResult.quantity_kg} kg)</h3>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green-deep)" }}>
                        Margin: {calcResult.margin_percentage}%
                      </span>
                    </div>

                    <div className="pf-row">
                      <span>Gross Market Revenue:</span>
                      <strong>₹{calcResult.gross_revenue.toLocaleString("en-IN")} (₹{calcResult.gross_price_per_kg.toFixed(2)}/kg)</strong>
                    </div>
                    <div className="pf-row">
                      <span>Logistics & Freight ({calcResult.distance_km} km):</span>
                      <strong style={{ color: "var(--danger)" }}>-₹{calcResult.transport_cost_total.toLocaleString("en-IN")} (-₹{calcResult.transport_cost_per_kg.toFixed(2)}/kg)</strong>
                    </div>
                    <div className="pf-row">
                      <span>Mandi Fee & APMC Cess:</span>
                      <strong style={{ color: "var(--danger)" }}>-₹{calcResult.mandi_fee_total.toLocaleString("en-IN")} (-₹{calcResult.mandi_fee_per_kg.toFixed(2)}/kg)</strong>
                    </div>
                    <div className="pf-row">
                      <span>Handling & Weighing Charges:</span>
                      <strong style={{ color: "var(--danger)" }}>-₹{calcResult.handling_cost_total.toLocaleString("en-IN")} (-₹{calcResult.handling_cost_per_kg.toFixed(2)}/kg)</strong>
                    </div>
                    {calcResult.storage_cost_total > 0 && (
                      <div className="pf-row">
                        <span>Storage & Holding:</span>
                        <strong style={{ color: "var(--danger)" }}>-₹{calcResult.storage_cost_total.toLocaleString("en-IN")} (-₹{calcResult.storage_cost_per_kg.toFixed(2)}/kg)</strong>
                      </div>
                    )}
                    <div
                      className="pf-row"
                      style={{
                        borderTop: "2px solid #E2E7DE",
                        marginTop: 10,
                        paddingTop: 10,
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: 900 }}>Final Net In-Hand Farmer Realization:</span>
                      <span style={{ fontSize: "22px", fontWeight: 900, color: "var(--green-deep)" }}>
                        ₹{calcResult.net_realization_total.toLocaleString("en-IN")} (₹{calcResult.net_realization_per_kg.toFixed(2)}/kg)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BUYER LEADS */}
          {activeTab === "buyers" && (
            <div>
              <div className="card card-pad">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 900 }}>
                      Verified Direct Buyer Leads for {selectedCrop}
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 2 }}>
                      Skip mandi commissions and freight by connecting directly with verified procurement buyers.
                    </p>
                  </div>
                </div>

                {overview.buyer_opportunities.opportunities.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-soft)" }}>
                    <Users size={36} color="var(--line-strong)" style={{ margin: "0 auto 10px" }} />
                    <p>No direct buyer opportunities found matching {selectedCrop} right now.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                    {overview.buyer_opportunities.opportunities.map((b) => (
                      <div
                        key={b.buyer_id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--line)",
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong style={{ fontSize: "15px" }}>{b.buyer_name}</strong>
                                {b.is_verified && <CheckCircle2 size={16} color="#176B45" />}
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 2 }}>
                                {b.company_name} · {b.location} ({b.distance_km} km)
                              </div>
                            </div>
                            <span
                              style={{
                                background: "#E8F5E9",
                                color: "#1B5E20",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: "11px",
                                fontWeight: 800,
                              }}
                            >
                              ★ {b.rating}
                            </span>
                          </div>

                          <div
                            style={{
                              background: "#F8FAF7",
                              padding: "10px 12px",
                              borderRadius: 8,
                              margin: "12px 0",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Required Quantity</div>
                              <div style={{ fontWeight: 700, fontSize: "13px" }}>{b.quantity_required_quintals} Qtl ({b.quality_grade})</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>Offered Price</div>
                              <div style={{ fontWeight: 900, fontSize: "16px", color: "var(--green-deep)" }}>
                                ₹{b.offered_price_per_kg.toFixed(2)}/kg
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--ink-mid)", marginBottom: 12 }}>
                            <div><strong>Payment:</strong> {b.payment_terms}</div>
                            <div><strong>Deadline:</strong> Within {b.deadline_days} days</div>
                            <div style={{ color: "#B06000", fontWeight: 700, marginTop: 4 }}>
                              Net Advantage: +₹{b.net_advantage_per_kg.toFixed(2)}/kg over local mandi
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-block"
                          onClick={() => navigate(`/lots/create?crop=${encodeURIComponent(selectedCrop)}&qty=${Math.min(quantityQuintals * 100, b.quantity_required_quintals * 100)}&price=${b.offered_price_per_kg}`)}
                        >
                          Create Selling Lot for Buyer <ArrowRight size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MarketPage;
