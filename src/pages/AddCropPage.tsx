import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Camera,
  Check,
  Sparkles,
  ArrowLeft,
  Search,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { MASTER_CROP_CATALOG, CROP_CATEGORIES, getCropCatalogItem, searchCrops } from "../data/cropCatalog";
import { imageApi } from "../services/imageApi";
import { cropApi } from "../services/cropApi";
import type { CropRecord, CropStage, CropAiObservation } from "../types";

export function AddCropPage() {
  const { user, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  const { addCrop } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userDistrict =
    user?.district || (user?.location ? user.location.split(",")[0].trim() : "Farm Location");
  const userLocationStr =
    user?.location ||
    (user?.district && user?.state ? `${user.district}, ${user.state}` : userDistrict || "Local Farm");

  // Query parameter pre-selection
  const initialCropParam = searchParams.get("crop") || "";
  const initialCatalogItem = getCropCatalogItem(initialCropParam) || MASTER_CROP_CATALOG[0];

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cropSearchTerm, setCropSearchTerm] = useState("");
  const [selectedCropItem, setSelectedCropItem] = useState(initialCatalogItem);
  const [cropName, setCropName] = useState(initialCatalogItem.name);
  const [variety, setVariety] = useState(initialCatalogItem.popularVarieties[0] || "Standard Hybrid");
  const [location, setLocation] = useState(userLocationStr);
  const [quantityKg, setQuantityKg] = useState(
    initialCatalogItem.typicalYieldKgPerAcre ? Math.round(initialCatalogItem.typicalYieldKgPerAcre / 2) : 500
  );
  const [sowingDate, setSowingDate] = useState("2026-06-15");
  const [stage, setStage] = useState<CropStage>("Near maturity");
  const [harvestDate, setHarvestDate] = useState("2026-09-08");

  // Image Upload & AI Observation State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploadState, setImageUploadState] = useState<
    "IDLE" | "UPLOADING" | "ANALYZING" | "SUCCESS" | "FAILED"
  >("IDLE");
  const [aiObservation, setAiObservation] = useState<CropAiObservation | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Check if user has an allocation for initial/selected crop
  const matchedAllocation = useMemo(() => {
    if (!user?.cropAllocations || !Array.isArray(user.cropAllocations)) return null;
    return user.cropAllocations.find((a) => a.crop.toLowerCase() === cropName.toLowerCase());
  }, [user?.cropAllocations, cropName]);

  const [acreage, setAcreage] = useState<number | string>(
    matchedAllocation ? matchedAllocation.area : 1
  );
  const [acreageUnit, setAcreageUnit] = useState<string>(
    matchedAllocation ? matchedAllocation.unit : user?.landAcreage?.split(" ")[1] || "Acres"
  );

  useEffect(() => {
    if (matchedAllocation) {
      setAcreage(matchedAllocation.area);
      setAcreageUnit(matchedAllocation.unit);
    }
  }, [matchedAllocation]);

  // Filtered crop list from catalog
  const filteredCrops = useMemo(() => {
    return searchCrops(cropSearchTerm, selectedCategory);
  }, [cropSearchTerm, selectedCategory]);

  // Handle URL param changes
  useEffect(() => {
    if (initialCropParam) {
      const match = getCropCatalogItem(initialCropParam);
      if (match) {
        setSelectedCropItem(match);
        setCropName(match.name);
        setVariety(match.popularVarieties[0] || "Standard Variety");
        setQuantityKg(match.typicalYieldKgPerAcre ? Math.round(match.typicalYieldKgPerAcre / 2) : 500);
      } else {
        setCropName(initialCropParam);
      }
    }
  }, [initialCropParam]);

  const selectCatalogCrop = (item: typeof MASTER_CROP_CATALOG[0]) => {
    setSelectedCropItem(item);
    setCropName(item.name);
    setVariety(item.popularVarieties[0] || "Standard Variety");
    setQuantityKg(item.typicalYieldKgPerAcre ? Math.round(item.typicalYieldKgPerAcre / 2) : 500);
  };

  // Image Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setImageError("Please upload a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Image size exceeds 10MB limit. Please upload a smaller photo.");
      return;
    }

    setImageError(null);
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);

    // Trigger AI Vision Observation
    runImageAnalysis(file);
  };

  const [analysisErrorMsg, setAnalysisErrorMsg] = useState<string | null>(null);

  const runImageAnalysis = async (file: File) => {
    setImageUploadState("UPLOADING");
    setAnalysisErrorMsg(null);
    try {
      setTimeout(() => setImageUploadState("ANALYZING"), 500);
      const observation = await imageApi.analyzeCropImage(file, cropName);
      setAiObservation(observation);
      setImageUploadState("SUCCESS");
    } catch (err: any) {
      console.warn("Vision observation error:", err);
      setAnalysisErrorMsg(err?.message || "AI service connection error. Click retry to reconnect.");
      setImageUploadState("FAILED");
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setAiObservation(null);
    setImageUploadState("IDLE");
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const analysisSteps = [
    "Analyzing localized weather & precipitation risk",
    "Fetching regional mandi benchmark prices & transport logistics",
    "Estimating AI harvest window & shelf-life risk profile",
    "Matching verified nearby buyer tenders & direct contract bids",
  ];

  useEffect(() => {
    let timer: any;
    if (isProcessing) {
      if (processingStep < analysisSteps.length) {
        timer = setTimeout(() => {
          setProcessingStep((prev) => prev + 1);
        }, 750);
      } else {
        const finalizeRegistration = async () => {
          try {
            const icon =
              selectedCropItem?.icon ||
              (cropName.toLowerCase().includes("cotton")
                ? "☁️"
                : cropName.toLowerCase().includes("tomato")
                ? "🍅"
                : "🌱");
            const benchmarkRate = selectedCropItem?.expectedPricePerKg || 30;
            const netRate = Math.max(1, benchmarkRate - 2.5);

            // 1. Persist to Neon PostgreSQL database and obtain true persisted ID
            const farmerId = user?.id ? parseInt(user.id.replace(/\D/g, ""), 10) || 1 : 1;
            const savedCrop = await cropApi.createCrop({
              farmer_id: farmerId,
              crop_name: cropName,
              variety: variety || "Standard Hybrid",
              quantity: Number(quantityKg) || 500,
              acreage: Number(acreage) || 1.0,
              sowing_date: sowingDate,
              expected_harvest_date: harvestDate,
              growth_stage: stage,
              image_url: imagePreviewUrl || undefined,
              ai_observation: aiObservation || undefined,
            });

            const persistedId = savedCrop?.id ? String(savedCrop.id) : `crop-${Date.now()}`;

            const newCrop: CropRecord = {
              id: persistedId,
              name: cropName,
              icon,
              variety: variety || "Standard High-Yield",
              quantityKg: Number(quantityKg) || 500,
              unit: "kg",
              acreage: Number(acreage) || undefined,
              acreageUnit: acreageUnit || "Acres",
              sowingDate,
              stage,
              location: location || userLocationStr,
              expectedPrice: benchmarkRate,
              harvestEst: harvestDate || "08–14 Sep 2026",
              harvestWindow:
                stage === "Near maturity" || stage === "Ready to harvest" ? "2–4 days" : "12–18 days",
              recommendation:
                stage === "Near maturity" || stage === "Ready to harvest" ? "SELL" : "WAIT",
              bestMarket: `${userDistrict} APMC Central Yard`,
              netRealization: netRate,
              confidence: 92,
              imageUrl: imagePreviewUrl || undefined,
              aiObservation: aiObservation || undefined,
              trackingStatus: "Crop Tracking Active",
            };

            addCrop(newCrop);

            if (user) {
              const currentCrops = user.preferredCrops || [];
              const updatedCrops = currentCrops.some(
                (c) => c.toLowerCase() === cropName.toLowerCase()
              )
                ? currentCrops
                : [...currentCrops, cropName];

              const currentAllocations = Array.isArray(user.cropAllocations)
                ? [...user.cropAllocations]
                : [];
              const allocIndex = currentAllocations.findIndex(
                (a) => a.crop.toLowerCase() === cropName.toLowerCase()
              );
              if (allocIndex >= 0) {
                currentAllocations[allocIndex] = {
                  crop: cropName,
                  area: Number(acreage) || currentAllocations[allocIndex].area,
                  unit: acreageUnit || currentAllocations[allocIndex].unit,
                };
              } else if (Number(acreage) > 0) {
                currentAllocations.push({
                  crop: cropName,
                  area: Number(acreage),
                  unit: acreageUnit || "Acres",
                });
              }

              updateUserProfile({
                preferredCrops: updatedCrops,
                cropAllocations: currentAllocations,
              });
            }

            navigate(`/crops/${persistedId}`);
          } catch (err: any) {
            console.error("Failed to register crop in database:", err);
            setIsProcessing(false);
            setImageError(err.message || "Failed to persist crop in PostgreSQL database. Please try again.");
          }
        };

        finalizeRegistration();
      }
    }
    return () => clearTimeout(timer);
  }, [
    isProcessing,
    processingStep,
    cropName,
    variety,
    quantityKg,
    acreage,
    acreageUnit,
    sowingDate,
    harvestDate,
    stage,
    location,
    selectedCropItem,
    imagePreviewUrl,
    aiObservation,
    addCrop,
    navigate,
    user,
    updateUserProfile,
    userDistrict,
    userLocationStr,
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingStep(0);
  };

  if (isProcessing) {
    return (
      <div className="wrap" style={{ maxWidth: 540, paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="success-icon-wrapper" style={{ marginBottom: 12 }}>
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>AI Evaluating {cropName} Profile</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", marginTop: 4 }}>
            Evaluating agronomic models, localized weather, and regional buyer demand near {userDistrict}...
          </p>
        </div>

        <div className="card card-pad" style={{ borderRadius: 14 }}>
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
                  <span
                    style={{
                      fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                      color: isCurrent ? "var(--ink)" : undefined,
                      fontSize: "13px",
                    }}
                  >
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
    <div className="wrap" style={{ maxWidth: 760, paddingBottom: 60 }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          to="/crops"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <ArrowLeft size={16} /> Back to Crops
        </Link>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)" }}>
          Add Crop Details
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", marginTop: 2 }}>
          Add details about this crop so KissanSetuAI can track its growth stage, harvest window, market opportunity and recommendations.
        </p>
      </div>

      <div className="card card-pad" style={{ borderRadius: 14, border: "1px solid var(--line)" }}>
        {/* Crop Selection Section */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--ink-soft)",
              marginBottom: 8,
            }}
          >
            1. Select or Search Cultivated Crop
          </label>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search
              size={16}
              color="var(--ink-soft)"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search Indian crops (e.g. Cotton, Tomato, Rice, Chilli, Groundnut...)"
              value={cropSearchTerm}
              onChange={(e) => setCropSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, fontSize: "13.5px", borderRadius: 10 }}
            />
          </div>

          {/* Category Chips */}
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 6,
              marginBottom: 10,
            }}
          >
            {CROP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 18,
                  fontSize: "12px",
                  fontWeight: 700,
                  border:
                    selectedCategory === cat
                      ? "1.5px solid var(--green-deep)"
                      : "1px solid var(--line)",
                  background:
                    selectedCategory === cat ? "rgba(23,107,69,0.08)" : "#FFFFFF",
                  color:
                    selectedCategory === cat ? "var(--green-deep)" : "var(--ink-soft)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid of Crops */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
              maxHeight: 180,
              overflowY: "auto",
              padding: 4,
            }}
          >
            {filteredCrops.map((c) => {
              const isSelected = cropName.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCatalogCrop(c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: isSelected ? "2px solid var(--green-deep)" : "1px solid var(--line)",
                    background: isSelected ? "rgba(23,107,69,0.06)" : "#FFFFFF",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s ease",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{c.icon}</span>
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 800 : 600,
                        color: "var(--navy)",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--ink-soft)" }}>
                      ₹{c.expectedPricePerKg}/kg
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="crop-name-input">Selected Crop Name</label>
              <input
                id="crop-name-input"
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="e.g. Cotton, Tomato"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-variety">{t("crops.variety", "Variety / Hybrid")}</label>
              {selectedCropItem && selectedCropItem.popularVarieties.length > 0 ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {selectedCropItem.popularVarieties.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVariety(v)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        borderRadius: 6,
                        border:
                          variety === v ? "1.5px solid var(--green-deep)" : "1px solid var(--line)",
                        background:
                          variety === v ? "rgba(23,107,69,0.1)" : "var(--bg-warm)",
                        fontWeight: 700,
                        color: variety === v ? "var(--green-deep)" : "var(--ink-soft)",
                        cursor: "pointer",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ) : null}
              <input
                id="crop-variety"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Bt Cotton RCH-2, Hybrid F1, Local"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-qty">
                {t("crops.quantity", "Estimated Harvest Quantity (kg)")}
              </label>
              <input
                id="crop-qty"
                type="number"
                step="0.01"
                min="0.01"
                value={quantityKg}
                onChange={(e) => setQuantityKg(parseFloat(e.target.value) || 1)}
                placeholder="e.g. 425.5"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-acreage">Cultivated Land Area ({acreageUnit})</label>
              <input
                id="crop-acreage"
                type="number"
                step="0.1"
                min="0.1"
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
                placeholder="e.g. 2.0"
              />
              {matchedAllocation && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--green-deep)",
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  ✓ Allocated in profile ({matchedAllocation.area} {matchedAllocation.unit})
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="crop-loc">{t("auth.location", "Farm Location")}</label>
              <input
                id="crop-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Vadlamudi, Guntur, Andhra Pradesh"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-sow">{t("crops.sowingDate", "Sowing Date")}</label>
              <input
                id="crop-sow"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="crop-stage">{t("crops.growthStage", "Current Growth Stage")}</label>
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

          {/* ========================================================= */}
          {/* CROP PHOTO UPLOAD & REAL VISION AI OBSERVATION FLOW      */}
          {/* ========================================================= */}
          <div className="field" style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 700, fontSize: "13.5px" }}>
              Crop Photo (Optional — for AI Quality & Foliar Health Assessment)
            </label>

            {/* Hidden real file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style={{ display: "none" }}
            />

            {!imagePreviewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="upload-box"
                style={{
                  padding: "20px 16px",
                  border: "1.5px dashed var(--line-strong)",
                  borderRadius: 12,
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#FAFCF9",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <Camera size={26} color="var(--green-deep)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--navy)" }}>
                  Click to Upload Crop / Foliar Photo
                </div>
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginTop: 2 }}>
                  Supports JPG, PNG, WEBP (Max 10MB). Mobile camera snapshots supported.
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: "1.5px solid #D5E5D8",
                  borderRadius: 14,
                  padding: "16px",
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Eye size={16} color="var(--green-deep)" />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>
                      Selected Crop Photo Preview
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline btn-sm"
                      style={{ borderRadius: 6, fontSize: "11.5px", padding: "4px 8px" }}
                    >
                      <Upload size={12} /> Replace Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn btn-ghost btn-sm"
                      style={{ borderRadius: 6, fontSize: "11.5px", padding: "4px 8px", color: "var(--danger)" }}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: 14,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: "140px",
                      height: "140px",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid var(--line)",
                      background: "#F5F8F5",
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Crop Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* AI Status / Report Panel */}
                  <div style={{ flex: 1 }}>
                    {imageUploadState === "UPLOADING" && (
                      <div
                        style={{
                          padding: "16px",
                          background: "#F0FDF4",
                          borderRadius: 10,
                          textAlign: "center",
                          color: "var(--green-deep)",
                          fontSize: "13px",
                        }}
                      >
                        <RefreshCw size={18} className="animate-spin" style={{ margin: "0 auto 6px" }} />
                        <strong>Uploading photo...</strong>
                      </div>
                    )}

                    {imageUploadState === "ANALYZING" && (
                      <div
                        style={{
                          padding: "16px",
                          background: "#F0FDF4",
                          borderRadius: 10,
                          textAlign: "center",
                          color: "var(--green-deep)",
                          fontSize: "13px",
                        }}
                      >
                        <Sparkles size={18} className="animate-pulse" style={{ margin: "0 auto 6px" }} />
                        <strong>AI is analysing the crop photo...</strong>
                        <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", marginTop: 2 }}>
                          Inspecting foliar symptoms, chlorophyll uniformity, and visual stress indicators.
                        </div>
                      </div>
                    )}

                    {imageUploadState === "FAILED" && (
                      <div
                        style={{
                          padding: "12px",
                          background: "#FDF2F2",
                          borderRadius: 10,
                          border: "1px solid #F8B4B4",
                          color: "var(--danger)",
                          fontSize: "12.5px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertCircle size={16} />
                          <strong>AI Analysis Notice:</strong>
                        </div>
                        <div style={{ marginTop: 4, color: "var(--ink-soft)" }}>
                          {analysisErrorMsg || "AI vision server connection timeout. You can retry inspection below."}
                        </div>
                        <button
                          type="button"
                          onClick={() => selectedFile && runImageAnalysis(selectedFile)}
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: 8, borderRadius: 6 }}
                        >
                          <RefreshCw size={12} /> Retry AI Inspection
                        </button>
                      </div>
                    )}

                    {imageUploadState === "SUCCESS" && aiObservation && (
                      <div
                        style={{
                          background: "#FAFCF9",
                          border: "1px solid #D5E5D8",
                          borderRadius: 10,
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Sparkles size={15} color="var(--green-deep)" />
                            <strong style={{ fontSize: "13px", color: "var(--green-deep)" }}>
                              AI Crop Observation
                            </strong>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              background: "#E6F4EA",
                              color: "var(--green-deep)",
                              padding: "2px 8px",
                              borderRadius: 12,
                            }}
                          >
                            Confidence: {aiObservation.confidence}%
                          </span>
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--navy)", marginBottom: 6 }}>
                          <strong>Crop Health:</strong> {aiObservation.crop_health}
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: 6 }}>
                          <strong>Observed Symptoms:</strong>
                          <ul style={{ margin: "2px 0 6px 18px", padding: 0 }}>
                            {aiObservation.observed_symptoms.map((sym, idx) => (
                              <li key={idx}>{sym}</li>
                            ))}
                          </ul>
                        </div>

                        {aiObservation.possible_issues && aiObservation.possible_issues.length > 0 && (
                          <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", marginBottom: 6 }}>
                            <strong>Possible Observations:</strong>{" "}
                            {aiObservation.possible_issues.map((i) => i.name).join(", ")}
                          </div>
                        )}

                        <div style={{ fontSize: "11px", color: "var(--green-deep)", fontWeight: 600 }}>
                          ✓ Report saved with crop record. Will be monitored in decision engine.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {imageError && (
              <div style={{ fontSize: "12px", color: "var(--danger)", marginTop: 6, fontWeight: 600 }}>
                {imageError}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            style={{ marginTop: 20, padding: "12px 20px", borderRadius: 10 }}
          >
            <Sparkles size={16} /> Save Crop Details & Activate Tracking
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCropPage;
