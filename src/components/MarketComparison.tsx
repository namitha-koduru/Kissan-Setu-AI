import type { MarketQuote } from "../types";

export function MarketComparison({ markets }: { markets: MarketQuote[] }) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Nearby Mandi Comparison</h3>
        <span className="demo-tag">NET REALIZATION RANKING</span>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Mandi Price</th>
              <th>Transport Cost</th>
              <th>Demand</th>
              <th>Distance</th>
              <th>Expected Net Realization</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.id} className={m.recommended ? "highlight" : ""}>
                <td data-label="Market">
                  <strong>{m.name}</strong>
                  {m.recommended && (
                    <span style={{ marginLeft: 6, fontSize: "11px", color: "var(--green-deep)", fontWeight: 700 }}>
                      ★ Best Net
                    </span>
                  )}
                </td>
                <td data-label="Mandi Price">₹{m.pricePerKg}/kg</td>
                <td data-label="Transport Cost">₹{m.transportCost}</td>
                <td data-label="Demand">
                  <span className={`badge-pill badge-${m.demand.toLowerCase()}`}>{m.demand}</span>
                </td>
                <td data-label="Distance">{m.distanceKm} km</td>
                <td
                  data-label="Expected Net Realization"
                  style={{
                    fontWeight: 800,
                    fontSize: "15px",
                    color: m.recommended ? "var(--green-deep)" : "inherit",
                  }}
                >
                  ₹{m.netPerKg}/kg
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="disclaimer" style={{ marginTop: 12 }}>
        💡 <strong>Key Product Insight:</strong> Highest listed market price does not always mean highest farmer earning. Transport deductions and handling losses change the real net outcome.
      </p>
    </div>
  );
}
