import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, Package } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { buyers, cropOptions } from "../data/demo";
import type { LotRecord } from "../types";

export function CreateLotPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addLot, addOffer, lots } = useAppState();

  const buyerId = params.get("buyer");
  const targetBuyer = buyers.find((b) => b.id === buyerId);
  const paramCrop = params.get("crop");

  const [crop, setCrop] = useState(targetBuyer?.crop || paramCrop || "Tomato");
  const [quantityKg, setQuantityKg] = useState<number | string>(targetBuyer ? 500 : 500);
  const [quality, setQuality] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState("2026-09-07");
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [expectedPrice, setExpectedPrice] = useState<number | string>(targetBuyer?.offeredPrice || 30);
  const [isCreated, setIsCreated] = useState(false);
  const [createdLotId, setCreatedLotId] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newId = `KS-2026-00${lots.length + 1}`;
    const newLot: LotRecord = {
      id: newId,
      crop,
      quantityKg: Number(quantityKg) || 500,
      quality,
      harvestDate,
      location,
      expectedPrice: Number(expectedPrice) || 30,
      status: "Open for Offers",
      interests: 2,
      createdDate: "Today",
    };

    addLot(newLot);

    // Add matching buyer offer
    addOffer({
      id: `off-${Date.now()}`,
      lotId: newId,
      buyerName: targetBuyer ? targetBuyer.name : "FreshFarm Foods",
      verified: true,
      pricePerKg: Number(expectedPrice) + 1,
      quantityKg: Number(quantityKg) || 500,
      quality,
      expiresInDays: "2 days",
      status: "Pending",
    });

    setCreatedLotId(newId);
    setIsCreated(true);
  };

  if (isCreated) {
    return (
      <div className="wrap" style={{ maxWidth: 480, paddingTop: 40, textAlign: "center" }}>
        <div className="card card-pad" style={{ padding: "40px 28px" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(23,107,69,0.12)",
              color: "var(--green-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <CheckCircle2 size={32} color="#176B45" />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "6px" }}>LOT CREATED SUCCESSFULLY</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "22px" }}>
            Your lot is now live in the marketplace and visible to matching institutional buyers.
          </p>

          <div className="pf-row">
            <span className="l">Generated Lot ID</span>
            <span className="v" style={{ fontWeight: 800 }}>{createdLotId}</span>
          </div>
          <div className="pf-row">
            <span className="l">Crop & Volume</span>
            <span className="v">{crop} · {quantityKg} kg</span>
          </div>
          <div className="pf-row">
            <span className="l">Marketplace Status</span>
            <span className="v" style={{ color: "var(--green-deep)", fontWeight: 800 }}>
              Open for Offers (2 Incoming)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button
              className="btn btn-primary btn-block"
              type="button"
              onClick={() => navigate("/lots")}
            >
              View My Lots
            </button>
            <button
              className="btn btn-outline btn-block"
              type="button"
              onClick={() => navigate(`/offers?lot=${createdLotId}`)}
            >
              Inspect Incoming Buyer Offers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 660 }}>
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Create Selling Lot</h1>
        {targetBuyer ? (
          <p style={{ color: "var(--green-deep)", fontSize: "14px", fontWeight: 600, marginTop: 2 }}>
            Targeting Buyer: {targetBuyer.name} (Offered: ₹{targetBuyer.offeredPrice}/kg)
          </p>
        ) : (
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Package your harvested or ready-to-harvest produce into a verified trade lot.
          </p>
        )}
      </div>

      <div className="card card-pad">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="lot-crop">Crop</label>
              <select
                id="lot-crop"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
              >
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="lot-qty">Lot Quantity (kg)</label>
              <input
                id="lot-qty"
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lot-grade">Quality Grade</label>
              <select
                id="lot-grade"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="Grade A">Grade A (Premium / Export Quality)</option>
                <option value="Grade B+">Grade B+ (Wholesale Table Grade)</option>
                <option value="Grade B">Grade B (Processing Grade)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="lot-harvest">Availability / Harvest Date</label>
              <input
                id="lot-harvest"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lot-loc">Farm Pickup Location</label>
              <input
                id="lot-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lot-price">Target Expected Price (₹/kg)</label>
              <input
                id="lot-price"
                type="number"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="e.g. 30"
                required
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 6 }}>
            <label>Lot Photographs (Optional)</label>
            <div className="upload-box">
              <Camera size={22} color="#176B45" style={{ margin: "0 auto 6px" }} />
              <div>Upload photos showing produce color, sizing, and crates</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 14, padding: "12px 20px" }}>
            <Package size={16} /> Create & Publish Lot to Marketplace
          </button>
        </form>
      </div>
    </div>
  );
}
