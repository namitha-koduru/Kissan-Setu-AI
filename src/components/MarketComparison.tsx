import type { MarketQuote } from "../types";

export function MarketComparison({ markets }: { markets: MarketQuote[] }) {
  return (
    <div className="table-wrap card">
      <div className="section-label">Market comparison</div>
      <table className="data">
        <thead>
          <tr>
            <th>Market</th>
            <th>Price</th>
            <th>Demand</th>
            <th>Distance</th>
            <th>Net realization</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id} className={m.recommended ? "recommended" : undefined}>
              <td>
                {m.name} {m.recommended && <span className="badge badge-green">Recommended</span>}
              </td>
              <td>₹{m.pricePerKg}/kg</td>
              <td>{m.demand}</td>
              <td>{m.distanceKm} km</td>
              <td>
                <strong>₹{m.netPerKg}/kg</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small" style={{ marginTop: 10 }}>
        Highest listed price is not always the best earning after transport and handling.
      </p>
    </div>
  );
}
