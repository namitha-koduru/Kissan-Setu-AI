import { useState } from "react";
import { MapPin, TrendingUp, Store } from "lucide-react";
import { MarketCard } from "../components/MarketCard";
import { MarketComparison } from "../components/MarketComparison";
import { PriceChart } from "../components/PriceChart";
import { cropOptions, marketsByCrop, tomatoTrend7, tomatoTrend30 } from "../data/demo";
import type { MarketQuote } from "../types";

export function MarketPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [activeFilter, setActiveFilter] = useState<"distance" | "price" | "demand" | "net">("net");

  const cropMarkets: MarketQuote[] = (marketsByCrop as Record<string, MarketQuote[]>)[selectedCrop] || marketsByCrop.Tomato;

  const sortedMarkets = [...cropMarkets].sort((a, b) => {
    if (activeFilter === "net") return b.netPerKg - a.netPerKg;
    if (activeFilter === "price") return b.pricePerKg - a.pricePerKg;
    if (activeFilter === "distance") return a.distanceKm - b.distanceKm;
    return 0;
  });

  const chartData = timeRange === "7d" ? tomatoTrend7 : tomatoTrend30;

  return (
    <div className="wrap">
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
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Market Intelligence</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Real-time style mandi comparison highlighting transport deduction and farmer net realization.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>Crop:</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", fontWeight: 700 }}
          >
            {cropOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row">
        <div
          className={`filter-chip ${activeFilter === "net" ? "active" : ""}`}
          onClick={() => setActiveFilter("net")}
        >
          <TrendingUp size={15} /> Sort by Highest Net Realization
        </div>
        <div
          className={`filter-chip ${activeFilter === "distance" ? "active" : ""}`}
          onClick={() => setActiveFilter("distance")}
        >
          <MapPin size={15} /> Shortest Distance
        </div>
        <div
          className={`filter-chip ${activeFilter === "price" ? "active" : ""}`}
          onClick={() => setActiveFilter("price")}
        >
          <Store size={15} /> Highest Mandi Price
        </div>
      </div>

      {/* Interactive Price Trend Chart */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: "16px" }}>
            Price Trend — {selectedCrop} (Nashik Mandi)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="tabs-row">
              <div
                className={`tab-btn ${timeRange === "7d" ? "active" : ""}`}
                onClick={() => setTimeRange("7d")}
              >
                7 Days
              </div>
              <div
                className={`tab-btn ${timeRange === "30d" ? "active" : ""}`}
                onClick={() => setTimeRange("30d")}
              >
                30 Days
              </div>
            </div>
            <span className="demo-tag">DEMO MANDI DATA</span>
          </div>
        </div>
        <PriceChart data={chartData} title="" />
      </div>

      {/* Nearby Mandi Cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Nearby Mandi Listings ({selectedCrop})</h3>
          <span style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
            Ranked by: <strong>{activeFilter.toUpperCase()}</strong>
          </span>
        </div>
        {sortedMarkets.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>

      {/* Full Comparison Table */}
      <MarketComparison markets={sortedMarkets} />
    </div>
  );
}
