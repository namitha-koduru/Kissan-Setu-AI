import type { LotRecord } from "../types";

export function LotCard({ lot }: { lot: LotRecord }) {
  return (
    <article className="lot-card">
      <div className="row space">
        <h3 style={{ margin: 0 }}>{lot.id}</h3>
        <span className="badge badge-green">{lot.status}</span>
      </div>
      <p>
        {lot.crop} · {lot.quantityKg} kg · {lot.quality}
      </p>
      <p className="small">
        Harvest {lot.harvestDate} · {lot.location} · Expected ₹{lot.expectedPrice}/kg
      </p>
      {lot.aggregated && (
        <p className="small">Aggregated lot · {lot.farmerCount} farmers</p>
      )}
    </article>
  );
}
