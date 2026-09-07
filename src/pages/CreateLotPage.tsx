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
          <div className="success-icon-wrapper">
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

          <div className="action-links" style={{ marginTop: 24 }}>
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
      <div className="mb-md" style={{ paddingTop: 10 }}>
        <Link
          to={buyerId ? `/buyers/${buyerId}` : "/buyers"}
          className="back-link"
        >
          <ArrowLeft size={14} /> Back to {buyerId ? "Buyer Profile" : "Marketplace"}
        </Link>
      </div>

      {/* Header */}
      <div className="page-header" style={{ padding: "10px 0 16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Create & Publish Selling Lot</h1>
        {targetBuyer ? (
          <div className="target-buyer-highlight">
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

          <div className="field mb-md">
            <label htmlFor="lot-loc">Farm Pickup & Dispatch Location</label>
            <input
              id="lot-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pimpalgaon Baswant, Nashik, Maharashtra"
              required
            />
          </div>

          <div className="field mb-md">
            <label htmlFor="lot-desc">Produce Quality Details & Packaging Notes</label>
            <textarea
              id="lot-desc"
              rows={2}
              value={qualityDesc}
              onChange={(e) => setQualityDesc(e.target.value)}
              placeholder="Describe color, sizing, sorting, crate packaging, or moisture level..."
              className="form-control"
            />
          </div>

          {/* Photo Upload Attachment */}
          <div className="field mb-md">
            <label>Produce Photographs (Recommended for Fast Verification)</label>

            {selectedPhoto ? (
              <div className="photo-preview">
                <img
                  src={selectedPhoto}
                  alt="Produce Preview"
                />
                <div style={{ flex: 1 }}>
                  <div className="photo-preview-name">{photoName || "Produce Photo Attached"}</div>
                  <div className="photo-preview-desc">Ready for digital verification inspection by buyers</div>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="photo-remove-btn"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="photo-drop-zone">
                <UploadCloud size={28} color="#176B45" style={{ marginBottom: 6 }} />
                <div className="photo-drop-zone-title">
                  Click or drag photo of produce lot
                </div>
                <div className="photo-drop-zone-desc">
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
            style={{ marginTop: 20 }}
          >
            <Package size={16} /> {isSubmitting ? "Publishing Lot..." : "Publish Lot to Verified Buyers"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateLotPage;
