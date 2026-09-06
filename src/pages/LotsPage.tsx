import { useState, type FormEvent } from "react";
import { LotCard } from "../components/LotCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { useAuth } from "../context/AuthContext";
import { cropOptions, fpoFarmers } from "../data/demo";
import { lotService } from "../services/lotService";

export function LotsPage() {
  const { lots, addLot, addOffer } = useAppState();
  const { user } = useAuth();
  const [crop, setCrop] = useState("Tomato");
  const [quantityKg, setQuantityKg] = useState(500);
  const [quality, setQuality] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState("2026-09-07");
  const [location, setLocation] = useState("Nashik");
  const [expectedPrice, setExpectedPrice] = useState(29);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aggregate, setAggregate] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const qty = aggregate ? fpoFarmers.reduce((s, f) => s + f.quantityKg, 0) : quantityKg;
    const lot = await lotService.create({
      crop,
      quantityKg: qty,
      quality,
      harvestDate,
      location,
      expectedPrice,
      aggregated: aggregate,
      farmerCount: aggregate ? fpoFarmers.length : 1,
    });
    addLot(lot);
    addOffer({
      id: `off-${Date.now()}`,
      lotId: lot.id,
      buyerName: "FreshFarm Foods",
      pricePerKg: expectedPrice + 2,
      quantityKg: qty,
      quality,
      expiresInDays: 3,
      status: "Pending",
    });
    setCreatedId(lot.id);
    setBusy(false);
  }

  return (
    <div className="page">
      <h1 className="page-title">Create lot</h1>
      <p className="page-sub">Open your produce for buyer offers after you have a recommended action.</p>
      <div className="grid-2">
        <form className="card" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="crop">Crop</label>
            <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
              {cropOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="qty">Quantity (kg)</label>
            <input id="qty" type="number" value={quantityKg} onChange={(e) => setQuantityKg(Number(e.target.value))} disabled={aggregate} />
          </div>
          <div className="field">
            <label htmlFor="q">Quality</label>
            <input id="q" value={quality} onChange={(e) => setQuality(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="h">Harvest date</label>
            <input id="h" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="loc">Location</label>
            <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ep">Expected price (₹/kg)</label>
            <input id="ep" type="number" value={expectedPrice} onChange={(e) => setExpectedPrice(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="img">Images</label>
            <input id="img" type="file" accept="image/*" />
          </div>
          {user?.role === "fpo" && (
            <label className="row">
              <input type="checkbox" checked={aggregate} onChange={(e) => setAggregate(e.target.checked)} />
              Create aggregated lot from FPO pool (1,500 kg)
            </label>
          )}
          <button className="btn btn-primary" disabled={busy} style={{ marginTop: 12 }}>
            {busy ? "Creating…" : "Create lot"}
          </button>
        </form>
        <div className="stack">
          {createdId && (
            <article className="card">
              <div className="section-label">Lot created</div>
              <h2>{createdId}</h2>
              <p>Status: Open for Offers</p>
              <p className="small">A sample buyer offer has been added so you can complete the demo flow on Offers.</p>
            </article>
          )}
          {lots.length === 0 ? (
            <EmptyState title="No lots yet" text="Create a lot to receive buyer offers." />
          ) : (
            lots.map((l) => <LotCard key={l.id} lot={l} />)
          )}
        </div>
      </div>
    </div>
  );
}
