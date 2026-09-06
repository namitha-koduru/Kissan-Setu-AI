import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CropCard } from "../components/CropCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { cropOptions, locationOptions } from "../data/demo";
import { cropService } from "../services/cropService";
import type { CropStage } from "../types";

export function FarmerPage() {
  const { crops, addCrop, setActiveCropId } = useAppState();
  const nav = useNavigate();
  const [name, setName] = useState("Potato");
  const [quantityKg, setQuantityKg] = useState(400);
  const [location, setLocation] = useState("Nashik");
  const [sowingDate, setSowingDate] = useState("2026-07-15");
  const [stage, setStage] = useState<CropStage>("Near maturity");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const crop = await cropService.create({
      name,
      quantityKg,
      location,
      sowingDate,
      stage,
    });
    addCrop(crop);
    setBusy(false);
    nav("/recommendation");
  }

  return (
    <div className="page">
      <h1 className="page-title">My crops</h1>
      <p className="page-sub">Add crop details so KisanSetu can recommend sell, wait or switch.</p>
      <div className="grid-2">
        <form className="card" onSubmit={onSubmit}>
          <div className="section-label">Add crop</div>
          <div className="field">
            <label htmlFor="crop">Crop</label>
            <select id="crop" value={name} onChange={(e) => setName(e.target.value)}>
              {cropOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="qty">Quantity (kg)</label>
            <input id="qty" type="number" value={quantityKg} onChange={(e) => setQuantityKg(Number(e.target.value))} />
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
            <label htmlFor="sow">Sowing date</label>
            <input id="sow" type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="stage">Crop stage</label>
            <select id="stage" value={stage} onChange={(e) => setStage(e.target.value as CropStage)}>
              <option>Sown</option>
              <option>Vegetative</option>
              <option>Flowering</option>
              <option>Near maturity</option>
              <option>Ready to harvest</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save crop and see recommendation"}
          </button>
        </form>
        <div className="stack">
          {crops.length === 0 ? (
            <EmptyState title="No crops added yet" text="Create your first crop to start the decision flow." />
          ) : (
            crops.map((c) => (
              <CropCard
                key={c.id}
                crop={c}
                harvestWindow="Open decision center"
                weatherRisk="See weather"
                onSelect={() => {
                  setActiveCropId(c.id);
                }}
              />
            ))
          )}
          <Link className="btn btn-secondary" to="/lots">
            Create a lot from a crop
          </Link>
        </div>
      </div>
    </div>
  );
}
