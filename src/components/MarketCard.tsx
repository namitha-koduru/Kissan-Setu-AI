import { MapPin, TrendingUp, Truck } from "lucide-react";
import type { MarketQuote } from "../types";

export function MarketCard({ market }: { market: MarketQuote }) {
  return (
    <div className={`mkt-compare-card ${market.recommended ? "recommended" : ""}`}>
      {market.recommended && <span className="rec-flag">RECOMMENDED (BEST NET)</span>}
      <div>
        <div className="mkt-name">
          {market.name}{" "}
          <span style={{ fontWeight: 500, fontSize: "12px", color: "var(--ink-soft)" }}>
            · {market.distanceKm} km
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: "12.5px", color: "var(--ink-soft)" }}>
          <MapPin size={13} color="#176B45" />
          <span>Transport: ₹{market.transportCost} (₹{(market.transportCost / 500).toFixed(1)}/kg)</span>
        </div>
      </div>
      <div className="mkt-figs">
        <div className="mkt-fig">
          <div className="l">Listed Mandi Price</div>
          <div className="v">₹{market.pricePerKg}/kg</div>
        </div>
        <div className="mkt-fig">
          <div className="l">Demand</div>
          <div className="v">
            <span className={`badge-pill badge-${market.demand.toLowerCase()}`}>{market.demand}</span>
          </div>
        </div>
        <div className="mkt-fig">
          <div className="l">Expected Net Realization</div>
          <div className="v net" style={{ color: "var(--green-deep)", fontSize: "17px" }}>
            ₹{market.netPerKg}/kg
          </div>
        </div>
      </div>
    </div>
  );
}
