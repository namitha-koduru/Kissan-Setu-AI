import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Package, ArrowLeft, Building2, UploadCloud, X } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { buyers as demoBuyers, cropOptions } from "../data/demo";
import apiClient from "../services/api";
import type { LotRecord } from "../types";

export function CreateLotPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addLot, addOffer, lots } = useAppState();

  const buyerId = params.get("buyer");
  const paramCrop = params.get("crop");
  const paramQty = params.get("qty");
  const paramPrice = params.get("price");

  // Matched target buyer info
  const targetBuyer = demoBuyers.find((b) => b.id === buyerId || b.id === `b-${buyerId}`);

  const [crop, setCrop] = useState(paramCrop || targetBuyer?.crop || "Tomato");
  const [quantityKg, setQuantityKg] = useState<number | string>(paramQty ? Number(paramQty) : 2000);
  const [quality, setQuality] = useState("Grade A");
  const [qualityDesc, setQualityDesc] = useState("Firm, uniform red harvest, sorted and packaged in 25kg ventilated crates.");
  const [harvestDate, setHarvestDate] = useState("2026-09-08");
  const [harvestWindow, setHarvestWindow] = useState("Immediate (Ready for Pickup)");
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [expectedPrice, setExpectedPrice] = useState<number | string>(paramPrice ? Number(paramPrice) : targetBuyer?.offeredPrice || 32);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdLotId, setCreatedLotId] = useState("");

  useEffect(() => {
    if (paramCrop) setCrop(paramCrop);
    if (paramQty) setQuantityKg(Number(paramQty));
    if (paramPrice) setExpectedPrice(Number(paramPrice));
  }, [paramCrop, paramQty, paramPrice]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoName("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `KS-2026-00${lots.length + 1}`;
    const qty = Number(quantityKg) || 2000;
    const price = Number(expectedPrice) || 32;

    try {
      // Try to create in backend API
      await apiClient.post("/lots", {
        crop,
        quantity_kg: qty,
        unit: "kg",
        quality,
        quality_description: qualityDesc,
        harvest_date: harvestDate,
        harvest_window: harvestWindow,
        location,
        expected_price: price,
        preferred_buyer_id: buyerId ? Number(buyerId) || 1 : undefined,
      });
    } catch (err) {
      console.warn("Backend lot creation fallback to local state", err);
    }

    // Local state sync
    const newLot: LotRecord = {
      id: generatedId,
      crop,
      quantityKg: qty,
      quality,
      harvestDate,
      location,
      expectedPrice: price,
      status: "Open for Offers",
      interests: buyerId ? 1 : 3,
      createdDate: "Today",
    };

    addLot(newLot);

    // If a target buyer was selected or generated, create initial offer
    addOffer({
      id: `off-${Date.now()}`,
      lotId: generatedId,
      buyerName: targetBuyer ? targetBuyer.name : "FreshFarm Wholesale Logistics",
      verified: true,
      pricePerKg: price >= 30 ? price : price + 1,
      quantityKg: qty,
      quality,
      expiresInDays: "2 days",
      status: "Pending",
    });

    setCreatedLotId(generatedId);
    setIsSubmitting(false);
    setIsCreated(true);
  };

  if (isCreated) {
    return (
      <div className="wrap" style={{ maxWidth: 520, paddingTop: 30, textAlign: "center" }}>
        <div className="card card-pad" style={{ padding: "36px 24px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(23,107,69,0.12)",
              color: "var(--green-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={36} color="#176B45" />
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "6px" }}>
            TRADE LOT CREATED & PUBLISHED
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "20px" }}>
            Your lot is now live on KissanSetu. Verified buyers matching your crop, grade, and volume have been notified.
          </p>

          <div className="pf-row">
            <span className="l">Trade Lot ID</span>
            <span className="v" style={{ fontWeight: 800 }}>{createdLotId}</span>
          </div>
          <div className="pf-row">
            <span className="l">Crop & Volume</span>
            <span className="v">{crop} · {quantityKg} kg ({Number(quantityKg) / 100} Qtl)</span>
          </div>
          <div className="pf-row">
            <span className="l">Target Price</span>
            <span className="v" style={{ fontWeight: 800, color: "var(--green-deep)" }}>
              ₹{expectedPrice}/kg
            </span>
          </div>
          <div className="pf-row">
            <span className="l">Marketplace Status</span>
            <span className="v" style={{ color: "var(--green-deep)", fontWeight: 800 }}>
              Active · Direct Offers Incoming
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button
              className="btn btn-primary btn-block"
              type="button"
              onClick={() => navigate(`/offers?lot=${createdLotId}`)}
            >
              Inspect Incoming Buyer Offers
            </button>
            <button
              className="btn btn-outline btn-block"
              type="button"
              onClick={() => navigate("/lots")}
            >
              View My Published Lots
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      {/* Back link */}
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link
          to={buyerId ? `/buyers/${buyerId}` : "/buyers"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back to {buyerId ? "Buyer Profile" : "Marketplace"}
        </Link>
      </div>

      {/* Header */}
      <div className="page-header" style={{ padding: "10px 0 16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Create & Publish Selling Lot</h1>
        {targetBuyer ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#E6F4EA",
              border: "1px solid #CEEAD6",
              padding: "8px 12px",
              borderRadius: 8,
              marginTop: 8,
              fontSize: "13.5px",
              color: "#137333",
              fontWeight: 700,
            }}
          >
            <Building2 size={16} /> Targeted Buyer: {targetBuyer.name} (Offered: ₹{expectedPrice}/kg)
          </div>
        ) : (
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Package your harvested or harvest-ready produce with grade, photos, and target price to receive direct offers.
          </p>
        )}
      </div>

      <div className="card card-pad">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="lot-crop">Crop Type</label>
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
              <label htmlFor="lot-qty">Lot Volume (kg)</label>
              <input
                id="lot-qty"
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g. 2000"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lot-grade">Quality Classification</label>
              <select
                id="lot-grade"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="Grade A">Grade A (Premium / Export Table Grade)</option>
                <option value="Grade B+">Grade B+ (Wholesale Table Quality)</option>
                <option value="Grade B">Grade B (Processing & Puree Grade)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="lot-harvest-window">Availability Window</label>
              <select
                id="lot-harvest-window"
                value={harvestWindow}
                onChange={(e) => setHarvestWindow(e.target.value)}
              >
                <option value="Immediate (Ready for Pickup)">Immediate (Ready for Pickup)</option>
                <option value="Next 24 to 48 Hours">Next 24 to 48 Hours</option>
                <option value="Harvesting in 3-5 Days">Harvesting in 3-5 Days</option>
                <option value="Next Week">Next Week</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="lot-harvest">Target Harvest / Pickup Date</label>
              <input
                id="lot-harvest"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lot-price">Target Expected Price (₹/kg)</label>
              <input
                id="lot-price"
                type="number"
                step="0.5"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="e.g. 32"
                required
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="lot-loc">Farm Pickup & Dispatch Location</label>
            <input
              id="lot-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pimpalgaon Baswant, Nashik, Maharashtra"
              required
            />
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="lot-desc">Produce Quality Details & Packaging Notes</label>
            <textarea
              id="lot-desc"
              rows={2}
              value={qualityDesc}
              onChange={(e) => setQualityDesc(e.target.value)}
              placeholder="Describe color, sizing, sorting, crate packaging, or moisture level..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--line-strong)",
                fontFamily: "inherit",
                fontSize: "13.5px",
              }}
            />
          </div>

          {/* Photo Upload Attachment */}
          <div className="field" style={{ marginTop: 12 }}>
            <label>Produce Photographs (Recommended for Fast Verification)</label>

            {selectedPhoto ? (
              <div
                style={{
                  position: "relative",
                  border: "1.5px solid var(--green-deep)",
                  borderRadius: 10,
                  padding: 12,
                  background: "#F4FAF5",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <img
                  src={selectedPhoto}
                  alt="Produce Preview"
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--ink)" }}>{photoName || "Produce Photo Attached"}</div>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Ready for digital verification inspection by buyers</div>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    background: "rgba(0,0,0,0.06)",
                    border: "none",
                    borderRadius: "50%",
                    width: 30,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed var(--line-strong)",
                  borderRadius: 10,
                  padding: "24px 16px",
                  cursor: "pointer",
                  background: "#FAFAFA",
                  textAlign: "center",
                }}
              >
                <UploadCloud size={28} color="#176B45" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>
                  Click or drag photo of produce lot
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 2 }}>
                  Show crate sorting, color maturity, and batch size
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={isSubmitting}
            style={{ marginTop: 20, padding: "12px 20px", fontSize: "14.5px" }}
          >
            <Package size={16} /> {isSubmitting ? "Publishing Lot..." : "Publish Lot to Verified Buyers"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateLotPage;
