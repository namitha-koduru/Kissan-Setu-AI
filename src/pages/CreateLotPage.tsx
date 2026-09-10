import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, ArrowLeft, ArrowRight, MapPin, Building2 } from "lucide-react";
import { useAuth, resolveFarmerId } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { cropOptions } from "../data/demo";
import apiClient from "../services/api";
import { cropApi } from "../services/cropApi";
import { inventoryApi } from "../services/inventoryApi";
import type { LotRecord } from "../types";

export function CreateLotPage() {
  const { user } = useAuth();
  const { crops, addLot, showToast } = useAppState();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const isFpo = user?.role === "fpo";
  const isBuyer = user?.role === "buyer";

  // Strict Buyer Access Guard: Block immediately if a buyer navigates here
  useEffect(() => {
    if (isBuyer) {
      showToast(t("lots.buyerBlocked", "Lot creation is available to Farmers and FPOs."));
      navigate("/buyers", { replace: true });
    }
  }, [isBuyer, navigate, showToast, t]);

  if (isBuyer) return null;

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

  const userDistrict =
    user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocStr =
    user?.location ||
    (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict);

  const [crop, setCrop] = useState(
    paramCrop || crops[0]?.name || availableCrops[0] || "Cotton",
  );
  const [quantityKg, setQuantityKg] = useState<number | string>(
    paramQty ? Number(paramQty) : isFpo ? 5000 : crops[0]?.quantityKg || 500,
  );
  const [quality, setQuality] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState("2026-09-10");
  const [readyDate, setReadyDate] = useState("2026-09-12");
  const [expectedPrice, setExpectedPrice] = useState<number | string>(
    paramPrice ? Number(paramPrice) : isFpo ? 65 : crops[0]?.expectedPrice || 32,
  );
  const [farmerCount, setFarmerCount] = useState<number>(isFpo ? 12 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdLotId, setCreatedLotId] = useState("");

  const [stockError, setStockError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStockError(null);
    setIsSubmitting(true);

    const prefix = isFpo ? "LOT-FPO" : "LOT-F";
    const generatedId = `${prefix}-${Date.now().toString().slice(-4)}`;
    const parsedQty = parseFloat(String(quantityKg));
    const qty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;
    const price = Number(expectedPrice) || 30;

    let backendLotId = generatedId;

    const activeUserId = resolveFarmerId(user);
    if (!activeUserId) {
      setStockError("Your farmer profile could not be loaded. Please sign in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Verify stock availability
      try {
        const summary = await inventoryApi.getSummary(activeUserId);
        const item = summary.items?.find((i) => i.crop_name.toLowerCase() === crop.toLowerCase());
        if (item && item.available_quantity < qty) {
          setStockError(`Only ${item.available_quantity} ${item.unit} is currently available to sell.`);
          setIsSubmitting(false);
          return;
        }
      } catch (stockErr) {
        console.warn("Stock summary check skipped:", stockErr);
      }

      // 2. Get crop for crop_id belonging to this farmer
      let targetCropId: number | null = null;
      try {
        const farmerCrops = await cropApi.getFarmerCrops(activeUserId);
        const matched = farmerCrops.find((c) => c.name.toLowerCase() === crop.toLowerCase());
        if (matched) {
          targetCropId = parseInt(matched.id.replace(/\D/g, ""), 10) || null;
        }
      } catch (cropErr) {
        console.warn("Could not match crop_id from remote DB:", cropErr);
      }

      // Fallback to local crop state if needed
      if (!targetCropId && crops.length > 0) {
        const stateMatch = crops.find((c) => c.name.toLowerCase() === crop.toLowerCase());
        if (stateMatch) {
          targetCropId = parseInt(stateMatch.id.replace(/\D/g, ""), 10) || null;
        }
      }

      if (!targetCropId) {
        // Auto-register crop in database if not yet registered
        try {
          const autoCrop = await cropApi.createCrop({
            farmer_id: activeUserId,
            crop_name: crop,
            variety: "Standard Selection",
            quantity: qty,
            acreage: 1.0,
            sowing_date: harvestDate,
            expected_harvest_date: readyDate,
            growth_stage: "Ready to harvest",
          });
          if (autoCrop && autoCrop.id) {
            targetCropId = autoCrop.id;
          }
        } catch (autoErr) {
          console.warn("Could not auto-register crop for lot:", autoErr);
        }
      }

      if (!targetCropId) {
        setStockError(`Please add ${crop} details under "Add Crop" first before listing a harvest lot.`);
        setIsSubmitting(false);
        return;
      }

      // 3. Post to backend /lots
      const created = await apiClient.post<any>(
        "/lots",
        {
          farmer_id: activeUserId,
          crop_id: targetCropId,
          quantity: qty,
          unit: "kg",
          asking_price: price,
          quality,
          quality_description: `${quality} ${isFpo ? "aggregated bulk pool" : "harvest"} from ${userDistrict}`,
          harvest_date: harvestDate,
          harvest_window: "2–4 days",
          location: userLocStr,
          status: "Open for Offers",
        },
        {
          "X-User-Role": user?.role || "farmer",
          "X-User-Id": String(activeUserId),
        }
      );
      if (created?.id) {
        backendLotId = `LOT-${created.id}`;
      }
    } catch (err: any) {
      console.warn("Backend lot creation error:", err);
      const detailMsg = err?.response?.data?.detail || err?.message;
      if (detailMsg && (detailMsg.includes("available to sell") || detailMsg.includes("Only "))) {
        setStockError(detailMsg);
        setIsSubmitting(false);
        return;
      }
      setStockError(detailMsg || "Failed to create lot. Please check stock availability.");
      setIsSubmitting(false);
      return;
    }

    const newLot: LotRecord = {
      id: backendLotId,
      crop,
      quantityKg: qty,
      quality,
      harvestDate,
      location: userLocStr,
      expectedPrice: price,
      status: "Open for Offers",
      interests: 3,
      createdDate: "Today",
      aggregated: isFpo,
      farmerCount: isFpo ? farmerCount : 1,
    };

    addLot(newLot);
    setCreatedLotId(backendLotId);
    setIsCreated(true);
    setIsSubmitting(false);
  };

  if (isCreated) {
    return (
      <div className="wrap" style={{ maxWidth: 560, padding: "40px 16px" }}>
        <div
          className="card card-pad text-center"
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: "32px 24px",
          }}
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
            {isFpo
              ? t("lots.fpoLotCreated", "Bulk Lot Created Successfully!")
              : t("lots.lotCreated", "Harvest Lot Created Successfully!")}
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
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {crop} ({quality})
              </span>
            </div>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Quantity</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {quantityKg} kg {isFpo && `(from ${farmerCount} member farmers)`}
              </span>
            </div>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Expected Rate</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)" }}>
                ₹{expectedPrice} / kg (₹{Number(expectedPrice) * 100} / Qtl)
              </span>
            </div>
            <div
              className="flex flex-between"
              style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 8 }}
            >
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Matched Network Demand</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sell)" }}>
                3 verified buyers match this lot
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 6 }}>
              Buyers have been notified of your lot availability. Direct procurement bids will appear under Offers.
            </div>
          </div>

          <div className="flex-col gap-sm">
            <Link to="/offers" className="btn btn-primary btn-block">
              <span>{t("offers.title", "Track Incoming Offers")}</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/buyers" className="btn btn-outline btn-block">
              <span>{t("nav.buyers", "View Matched Buyers in Area")}</span>
            </Link>
            <Link to={isFpo ? "/fpo" : "/dashboard"} className="btn btn-secondary btn-block">
              <span>{isFpo ? t("nav.fpoDashboard", "Return to FPO Dashboard") : t("nav.home", "Return to Dashboard")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingBottom: 60 }}>
      <div className="flex flex-between flex-center mb-lg">
        <Link to={isFpo ? "/fpo" : "/lots"} className="back-link">
          <ArrowLeft size={16} />
          <span>{isFpo ? t("common.backToFpo", "Back to FPO Dashboard") : t("common.back", "Back to Lots")}</span>
        </Link>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>
          📍 {userDistrict} {isFpo ? "Collection Hub" : "Farm Location"}
        </div>
      </div>

      <div
        className="card card-pad"
        style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}
      >
        <div
          className="flex flex-center gap-sm mb-md"
          style={{ borderBottom: "1px solid var(--line)", paddingBottom: 14 }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              background: "rgba(23,107,69,0.1)",
              color: "var(--green-deep)",
            }}
          >
            {isFpo ? <Building2 size={22} /> : <Package size={22} />}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: 0 }}>
              {isFpo
                ? t("lots.createBulkLot", "Create Aggregated Bulk Lot")
                : t("lots.create", "List Produce for Buyer Offers")}
            </h1>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>
              {isFpo
                ? t("lots.fpoCreateSubtitle", "Consolidate member smallholder volume for high-value corporate bids")
                : t("lots.farmerCreateSubtitle", "5-step selling flow: Select crop, verify stock, specify grade, set price, and open for buyer offers.")}
            </p>
          </div>
        </div>

        {/* 5-Step Selling Stepper */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 6,
            marginBottom: 20,
            padding: "10px 12px",
            background: "var(--bg-warm)",
            borderRadius: 10,
            border: "1px solid var(--line)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-soft)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--green-deep)" }}>1. Crop</div>
          <div style={{ color: "var(--green-deep)" }}>2. Quantity</div>
          <div style={{ color: "var(--green-deep)" }}>3. Quality</div>
          <div style={{ color: "var(--green-deep)" }}>4. Pricing</div>
          <div style={{ color: "var(--green-deep)" }}>5. Publish</div>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          {/* Step 1: Crop */}
          <div className="field">
            <label>1. {t("crops.cropName", "Select Crop")}</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="form-control"
              required
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2 & 3: Quantity & Quality */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>
                2. {isFpo
                  ? t("fpo.bulkQuantity", "Total Quantity (kg)")
                  : t("lots.quantity", "Quantity (kg)")}
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder={isFpo ? "e.g. 5000" : "e.g. 425"}
                className="form-control"
                required
              />
            </div>

            <div className="field">
              <label>3. {t("lots.qualityGrade", "Quality Grade")}</label>
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

          {isFpo && (
            <div className="field">
              <label>{t("fpo.contributingFarmersCount", "Contributing Member Farmers")}</label>
              <input
                type="number"
                min={1}
                max={100}
                value={farmerCount}
                onChange={(e) => setFarmerCount(Number(e.target.value))}
                className="form-control"
                required
              />
            </div>
          )}

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
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  color: "var(--ink-soft)",
                }}
              >
                = ₹{Number(expectedPrice || 0) * 100} / Qtl
              </span>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-warm)",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1px solid var(--line)",
            }}
          >
            <div className="flex flex-center gap-xs text-sm fw-700" style={{ color: "var(--navy)" }}>
              <MapPin size={15} color="var(--green-deep)" />
              <span>
                {isFpo ? "Collection Hub Origin" : "Farm Pickup Origin"}: {userLocStr}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
              Institutional buyers provide bids inclusive of logistics pickup from this hub.
            </div>
          </div>

          {stockError && (
            <div
              className="form-error-alert"
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "13.5px",
                fontWeight: 700,
              }}
            >
              ⚠️ {stockError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: 8 }}
          >
            <Package size={17} />
            <span>
              {isSubmitting
                ? "Creating Lot..."
                : isFpo
                ? "Publish Bulk Lot for Bidding"
                : "List Harvest Lot for Bidding"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateLotPage;
