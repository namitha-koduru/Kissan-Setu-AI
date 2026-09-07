import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { cropOptions, locationOptions } from "../data/demo";
import type { CropRecord, CropStage } from "../types";

export function AddCropPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addCrop } = useAppState();
  const navigate = useNavigate();

  const userDistrict = user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocationStr = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict || "Local Farm");

  const [cropName, setCropName] = useState("Tomato");
  const [variety, setVariety] = useState("Hybrid F1");
  const [location, setLocation] = useState(userLocationStr);
  const [quantityKg, setQuantityKg] = useState(500);
  const [sowingDate, setSowingDate] = useState("2026-06-15");
  const [stage, setStage] = useState<CropStage>("Near maturity");
  const [harvestDate, setHarvestDate] = useState("2026-09-08");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const analysisSteps = [
    "Analyzing localized weather & precipitation risk",
    "Fetching mandi wholesale prices & transport costs",
    "Estimating AI harvest window & spoilage risk",
    "Matching nearby verified buyer tenders & demand",
  ];

  useEffect(() => {
    let timer: any;
    if (isProcessing) {
      if (processingStep < analysisSteps.length) {
        timer = setTimeout(() => {
          setProcessingStep((prev) => prev + 1);
        }, 750);
      } else {
        timer = setTimeout(() => {
          const newCropId = `crop-${cropName.toLowerCase()}-${Date.now().toString(36).slice(-4)}`;
          const newCrop: CropRecord = {
            id: newCropId,
            name: cropName,
            icon: cropName === "Tomato" ? "🍅" : cropName === "Onion" ? "🧅" : cropName === "Potato" ? "🥔" : "🌶️",
            variety: variety || "Local High Yield",
            quantityKg: Number(quantityKg) || 500,
            unit: "kg",
            sowingDate,
            stage,
            location: location || userLocationStr,
            expectedPrice: cropName === "Tomato" ? 30 : cropName === "Onion" ? 20 : cropName === "Potato" ? 17 : 62,
            harvestEst: "08–12 Sep 2026",
            harvestWindow: stage === "Near maturity" || stage === "Ready to harvest" ? "2–4 days" : "12–18 days",
            recommendation: stage === "Near maturity" || stage === "Ready to harvest" ? "SELL" : "WAIT",
            bestMarket: `${userDistrict} APMC Mandi`,
            netRealization: cropName === "Tomato" ? 29 : cropName === "Onion" ? 18.2 : cropName === "Potato" ? 15.2 : 60.5,
            confidence: 91,
          };
          addCrop(newCrop);
          navigate(`/crops/${newCropId}`);
        }, 600);
      }
    }
    return () => clearTimeout(timer);
  }, [isProcessing, processingStep, cropName, variety, quantityKg, sowingDate, stage, location, addCrop, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingStep(0);
  };

  if (isProcessing) {
    return (
      <div className="wrap" style={{ maxWidth: 560, paddingTop: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="success-icon-wrapper" style={{ marginBottom: 12 }}>
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>AI Analyzing Your Crop</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            Combining real-time meteorological models with regional mandi price discovery...
          </p>
        </div>

        <div className="card card-pad">
          <div className="processing-list">
            {analysisSteps.map((stepText, idx) => {
              const isDone = processingStep > idx;
              const isCurrent = processingStep === idx;

              return (
                <div key={stepText} className={`proc-item ${isDone ? "done" : ""}`}>
                  <div className="proc-check">
                    {isDone ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : isCurrent ? (
                      <div className="spinner" />
                    ) : null}
                  </div>
                  <span style={{ fontWeight: isCurrent ? 700 : isDone ? 600 : 400, color: isCurrent ? "var(--ink)" : undefined }}>
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="page-header" style={{ padding: "20px 0 16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>{t("crops.addCrop")}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
          {t("crops.subtitle")}
        </p>
      </div>

      <div className="card card-pad">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="crop-select">{t("crops.cropName")}</label>
              <select
                id="crop-select"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
              >
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="crop-variety">{t("crops.variety")}</label>
              <input
                id="crop-variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Hybrid F1, Local Red"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-qty">{t("crops.quantity")}</label>
              <input
                id="crop-qty"
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Math.max(1, Number(e.target.value)))}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-loc">{t("auth.location")}</label>
              <select
                id="crop-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="crop-sow">{t("crops.sowingDate")}</label>
              <input
                id="crop-sow"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-stage">{t("crops.growthStage")}</label>
              <select
                id="crop-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as CropStage)}
              >
                <option value="Sowing">Sowing</option>
                <option value="Vegetative">Vegetative (Growth)</option>
                <option value="Flowering">Flowering</option>
                <option value="Near maturity">Near Maturity</option>
                <option value="Ready to harvest">Ready to Harvest</option>
                <option value="Harvested">Harvested (Stored)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="crop-harvest">Expected Harvest Date</label>
              <input
                id="crop-harvest"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 6 }}>
            <label>Field Photo (Optional - for AI quality grading preview)</label>
            <div className="upload-box">
              <Camera size={24} color="#176B45" style={{ margin: "0 auto 6px" }} />
              <div>Click to upload crop image or snap a photo from your phone</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: 12, padding: "12px 20px" }}>
            <Sparkles size={16} /> {t("common.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
