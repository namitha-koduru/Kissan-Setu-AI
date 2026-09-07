import { useState, useMemo, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Package, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { cropOptions } from "../data/demo";
import apiClient from "../services/api";
import type { LotRecord } from "../types";

export function CreateLotPage() {
  const { user } = useAuth();
  const { crops, addLot, lots } = useAppState();
  const { t } = useLanguage();
  const [params] = useSearchParams();

  const paramCrop = params.get("crop");
  const paramQty = params.get("qty");
  const paramPrice = params.get("price");

  const availableCrops = useMemo(() => {
    const list = [...cropOptions];
    crops.forEach((c) => {
      if (!list.includes(c.name as any)) list.push(c.name as any);
    });
    return list;
  }, [crops]);

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocStr = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict);

  const [crop, setCrop] = useState(paramCrop || crops[0]?.name || availableCrops[0] || "Tomato");
  const [quantityKg, setQuantityKg] = useState<number | string>(paramQty ? Number(paramQty) : (crops[0]?.quantityKg || 500));
  const [quality, setQuality] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState("2026-09-10");
  const [readyDate, setReadyDate] = useState("2026-09-12");
  const [expectedPrice, setExpectedPrice] = useState<number | string>(paramPrice ? Number(paramPrice) : (crops[0]?.expectedPrice || 30));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdLotId, setCreatedLotId] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `KS-2026-00${lots.length + 1}`;
    const qty = Number(quantityKg) || 500;
    const price = Number(expectedPrice) || 30;

    try {
      await apiClient.post("/lots", {
        crop,
        quantity_kg: qty,
        unit: "kg",
        quality,
        quality_description: `${quality} uniform harvest from ${userDistrict}`,
        harvest_date: harvestDate,
        harvest_window: "2–4 days",
        location: userLocStr,
        expected_price: price,
      });
    } catch (err) {
      console.warn("Backend lot creation fallback:", err);
    }

    const newLot: LotRecord = {
      id: generatedId,
      crop,
      quantityKg: qty,
      quality,
      harvestDate,
      location: userLocStr,
      expectedPrice: price,
      status: "Open for Offers",
      interests: 3,
      createdDate: "Today",
    };

    addLot(newLot);
    setCreatedLotId(generatedId);
    setIsCreated(true);
    setIsSubmitting(false);
  };

  if (isCreated) {
    return (
      <div className="wrap" style={{ maxWidth: 560, padding: "40px 16px" }}>
        <div
          className="card card-pad text-center"
          style={{ background: "#FFFFFF", border: "1.5px solid var(--line)", borderRadius: 16, padding: "32px 24px" }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "rgba(23,107,69,0.12)",
              color: "var(--green-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>
            Harvest Lot Created Successfully!
          </h2>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
            Lot ID: <strong>{createdLotId}</strong> · {userLocStr}
          </div>

          <div
            style={{
              background: "var(--bg-warm)",
              borderRadius: 12,
              border: "1px solid var(--line)",
              padding: "16px",
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Produce</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{crop} ({quality})</span>
            </div>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Quantity</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{quantityKg} kg</span>
            </div>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Expected Rate</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)" }}>₹{expectedPrice} / kg (₹{Number(expectedPrice) * 100} / Qtl)</span>
            </div>
            <div className="flex flex-between" style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Matched Buyers Nearby</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sell)" }}>3 Buyers demanding this crop</span>
            </div>
          </div>

          <div className="flex-col gap-sm">
            <Link to="/offers" className="btn btn-primary btn-block">
              <span>{t("offers.title", "View Buyer Offers")}</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-block">
              <span>{t("nav.home", "Return to Dashboard")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingBottom: 60 }}>
      <div className="flex flex-between flex-center mb-lg">
        <Link to="/lots" className="back-link">
          <ArrowLeft size={16} />
          <span>{t("common.back", "Back to Lots")}</span>
        </Link>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          📍 {userDistrict} Farm Location
        </div>
      </div>

      <div className="card card-pad" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}>
        <div className="flex flex-center gap-sm mb-lg" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <div style={{ padding: 10, borderRadius: 10, background: "rgba(23,107,69,0.1)", color: "var(--green-deep)" }}>
            <Package size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: 0 }}>
              {t("lots.create", "List Produce for Buyer Offers")}
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
              Create an open lot to receive competitive bids from verified buyers & FPCs
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          <div className="field">
            <label>{t("crops.cropName", "Select Crop")}</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="form-control"
              required
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>{t("lots.quantity", "Quantity (kg)")}</label>
              <input
                type="number"
                min={50}
                step={50}
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g. 500"
                className="form-control"
                required
              />
            </div>

            <div className="field">
              <label>{t("lots.quality", "Quality Grade")}</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="form-control"
              >
                <option value="Grade A">Grade A (Premium / Sorted)</option>
                <option value="Grade B">Grade B (Standard Commercial)</option>
                <option value="Export Grade">Export Grade (High Brix / Uniform)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>{t("crops.sowingDate", "Expected Harvest Date")}</label>
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="field">
              <label>{t("crops.harvestWindow", "Available for Pickup From")}</label>
              <input
                type="date"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>{t("offers.offeredPrice", "Expected Price (₹ / kg)")}</label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                min={5}
                max={500}
                step={0.5}
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="e.g. 30"
                className="form-control"
                required
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ink-soft)" }}>
                = ₹{Number(expectedPrice || 0) * 100} / Qtl
              </span>
            </div>
          </div>

          <div style={{ background: "var(--bg-warm)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--line)" }}>
            <div className="flex flex-center gap-xs text-sm fw-700" style={{ color: "var(--navy)" }}>
              <MapPin size={15} color="var(--green-deep)" />
              <span>Farm Pickup Origin: {userLocStr}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
              Buyers will provide quotes inclusive of farmgate logistics to this location.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: 8 }}
          >
            <Package size={17} />
            <span>{isSubmitting ? "Creating Lot..." : "List Harvest Lot for Bidding"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateLotPage;
