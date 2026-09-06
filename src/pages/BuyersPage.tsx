import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BuyerCard } from "../components/BuyerCard";
import { EmptyState, LoadingState } from "../components/States";
import { buyerService } from "../services/buyerService";
import { cropOptions } from "../data/demo";
import type { BuyerListing } from "../types";

export function BuyersPage() {
  const [params] = useSearchParams();
  const [crop, setCrop] = useState("");
  const [list, setList] = useState<BuyerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = params.get("id");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const data = await buyerService.list(crop || undefined);
      if (!alive) return;
      setList(data);
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [crop]);

  const detail = list.find((b) => b.id === selected);

  return (
    <div className="page">
      <h1 className="page-title">Buyer marketplace</h1>
      <p className="page-sub">Verified demand with quality, distance and offer windows. Demo listings.</p>
      <div className="field" style={{ maxWidth: 280 }}>
        <label htmlFor="crop">Crop needed</label>
        <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option value="">All crops</option>
          {cropOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {detail && (
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="section-label">Buyer details</div>
          <h2>{detail.name}</h2>
          <p>
            {detail.crop} · {detail.quantityKg.toLocaleString("en-IN")} kg · {detail.quality} · ₹{detail.offeredPrice}/kg
          </p>
          <p className="small">
            {detail.distanceKm} km from farm · Valid {detail.deadlineDays} days · {detail.verified ? "Verified buyer" : "Verification pending"}
          </p>
        </article>
      )}
      {loading ? (
        <LoadingState />
      ) : list.length === 0 ? (
        <EmptyState title="No nearby buyers found" text="Try another crop or widen your search later when live APIs are connected." />
      ) : (
        <div className="grid-2">
          {list.map((b) => (
            <BuyerCard key={b.id} buyer={b} />
          ))}
        </div>
      )}
    </div>
  );
}
