import { useEffect, useMemo, useState } from "react";
import { MarketCard } from "../components/MarketCard";
import { MarketComparison } from "../components/MarketComparison";
import { PriceChart } from "../components/PriceChart";
import { EmptyState, LoadingState } from "../components/States";
import { cropOptions, locationOptions } from "../data/demo";
import { marketService } from "../services/marketService";
import { rankMarkets } from "../engine/recommendation";
import type { MarketQuote, PricePoint } from "../types";

export function MarketPage() {
  const [crop, setCrop] = useState("Tomato");
  const [location, setLocation] = useState("Nashik");
  const [distance, setDistance] = useState(200);
  const [minPrice, setMinPrice] = useState(0);
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [markets, setMarkets] = useState<MarketQuote[]>([]);
  const [trend, setTrend] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const [m, t] = await Promise.all([marketService.list(crop), marketService.trend(range)]);
      if (!alive) return;
      setMarkets(rankMarkets(m, 500));
      setTrend(t);
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [crop, range]);

  const filtered = useMemo(
    () => markets.filter((m) => m.distanceKm <= distance && m.pricePerKg >= minPrice),
    [markets, distance, minPrice],
  );

  return (
    <div className="page">
      <h1 className="page-title">Market intelligence</h1>
      <p className="page-sub">
        Compare listed price with expected net realization around {location}. Demo mandi data — not live prices.
      </p>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-4">
          <div className="field">
            <label htmlFor="crop">Search crop</label>
            <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
              {cropOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="loc">Location</label>
            <select id="loc" value={location} onChange={(e) => setLocation(e.target.value)}>
              {locationOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dist">Max distance (km)</label>
            <input id="dist" type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="price">Min listed price</label>
            <input id="price" type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} />
          </div>
        </div>
      </div>
      {loading ? (
        <LoadingState label="Market data is being updated…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No markets in this filter" text="Widen distance or lower the minimum price." />
      ) : (
        <>
          <div className="grid-3">
            {filtered.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
          <div className="row" style={{ margin: "16px 0" }}>
            <button className={`btn ${range === "7d" ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => setRange("7d")}>
              7-day
            </button>
            <button className={`btn ${range === "30d" ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => setRange("30d")}>
              30-day
            </button>
          </div>
          <PriceChart data={trend} title={`${crop} price trend`} />
          <div style={{ marginTop: 16 }}>
            <MarketComparison markets={filtered} />
          </div>
        </>
      )}
    </div>
  );
}
