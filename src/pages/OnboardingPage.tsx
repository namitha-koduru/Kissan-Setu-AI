import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
  Building2,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { apiClient } from "../services/api";
import { ALL_INDIAN_STATES, getDistrictsForState } from "../data/indiaLocations";

const ALL_SUPPORTED_CROPS = [
  { name: "Tomato", emoji: "🍅" },
  { name: "Onion", emoji: "🧅" },
  { name: "Grapes", emoji: "🍇" },
  { name: "Chilli", emoji: "🌶️" },
  { name: "Potato", emoji: "🥔" },
  { name: "Pomegranate", emoji: "🍈" },
  { name: "Wheat", emoji: "🌾" },
  { name: "Cotton", emoji: "☁️" },
];

const SELLING_CHANNELS = [
  "APMC Mandi",
  "FPO Collective Pooling",
  "Direct Institutional Buyer",
  "Digital E-Nam / Marketplace",
];

const BUYER_BUSINESS_TYPES = [
  "Enterprise Food Processor",
  "Wholesale Mandi Trader",
  "Supermarket / Retail Chain",
  "Agri-Exporter",
  "Direct Procurement Startup",
];

const QUALITY_GRADES = [
  "Grade A (Premium / Export)",
  "Grade B+ (Standard Commercial)",
  "Processing Grade (Industrial)",
  "Fair Average Quality (FAQ)",
];

export function OnboardingPage() {
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAuth();
  const { updateOnboardData, showToast } = useAppState();
  const navigate = useNavigate();

  // If not logged in, go to register
  if (!user) {
    return <Navigate to="/register" replace />;
  }

  const role = user.role || "farmer";

  // Common step tracker
  const [step, setStep] = useState(1);
  const totalSteps = role === "farmer" ? 5 : 3;

  // ----------------------------------------------------------------
  // FARMER STATE
  // ----------------------------------------------------------------
  const [country] = useState("India");
  const [state, setState] = useState(user.state || "");
  const [district, setDistrict] = useState(user.district || "");
  const [village, setVillage] = useState(user.village || "");
  const [districtList, setDistrictList] = useState<string[]>([]);

  const [landValue, setLandValue] = useState("2.5");
  const [landUnit, setLandUnit] = useState("Acres");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(["Tomato", "Onion"]);
  const [otherCropInput, setOtherCropInput] = useState("");
  const [showOtherCrop, setShowOtherCrop] = useState(false);

  const [harvestQty, setHarvestQty] = useState("500");
  const [harvestUnit, setHarvestUnit] = useState("kg");
  const [sowingSeason, setSowingSeason] = useState("Kharif Season");

  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "APMC Mandi",
    "Direct Institutional Buyer",
  ]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [availableMarkets, setAvailableMarkets] = useState<
    { id: string | number; name: string; district?: string; state?: string }[]
  >([]);
  const [marketSearch, setMarketSearch] = useState("");
  const [loadingMarkets, setLoadingMarkets] = useState(false);

  // ----------------------------------------------------------------
  // BUYER STATE
  // ----------------------------------------------------------------
  const [buyerBusinessType, setBuyerBusinessType] = useState(BUYER_BUSINESS_TYPES[0]);
  const [buyerState, setBuyerState] = useState(user.state || "");
  const [buyerDistrict, setBuyerDistrict] = useState(user.district || "");
  const [buyerProcRadius, setBuyerProcRadius] = useState(100);
  const [buyerCrops, setBuyerCrops] = useState<string[]>(["Tomato", "Onion"]);
  const [buyerMinQty, setBuyerMinQty] = useState(10);
  const [buyerMaxQty, setBuyerMaxQty] = useState(500);
  const [buyerQuality, setBuyerQuality] = useState(QUALITY_GRADES[0]);
  const [buyerIndicativePrice, setBuyerIndicativePrice] = useState("");
  const [buyerGst, setBuyerGst] = useState("");

  // ----------------------------------------------------------------
  // FPO STATE
  // ----------------------------------------------------------------
  const [fpoRegNo, setFpoRegNo] = useState("");
  const [fpoState, setFpoState] = useState(user.state || "");
  const [fpoDistrict, setFpoDistrict] = useState(user.district || "");
  const [fpoMemberCount, setFpoMemberCount] = useState(150);
  const [fpoCrops, setFpoCrops] = useState<string[]>(["Tomato", "Onion", "Grapes"]);
  const [fpoPooledAcres, setFpoPooledAcres] = useState(250);
  const [fpoAnnualCapacity, setFpoAnnualCapacity] = useState(1200);
  const [fpoColdStorage, setFpoColdStorage] = useState(true);

  // Update district dropdown when state changes
  useEffect(() => {
    if (state) {
      const dList = getDistrictsForState(state);
      setDistrictList(dList);
      if (!dList.includes(district)) {
        setDistrict(dList[0] || "");
      }
    } else {
      setDistrictList([]);
    }
  }, [state]);

  // Load markets dynamically from API
  useEffect(() => {
    async function loadMarkets() {
      setLoadingMarkets(true);
      try {
        const res = await apiClient.get<any[]>("/markets");
        if (Array.isArray(res) && res.length > 0) {
          const list = res.map((m) => ({
            id: m.id,
            name: m.name,
            district: m.district,
            state: m.state,
          }));
          setAvailableMarkets(list);
          // Set initial default market if none chosen
          if (selectedMarkets.length === 0 && list[0]) {
            setSelectedMarkets([list[0].name]);
          }
        } else {
          // fallback
          setAvailableMarkets([
            { id: 1, name: "Lasalgaon Mandi", district: "Nashik", state: "Maharashtra" },
            { id: 2, name: "Nashik APMC", district: "Nashik", state: "Maharashtra" },
            { id: 3, name: "Pimpalgaon Mandi", district: "Nashik", state: "Maharashtra" },
            { id: 4, name: "Pune APMC", district: "Pune", state: "Maharashtra" },
            { id: 5, name: "Azadpur Mandi", district: "North Delhi", state: "Delhi" },
            { id: 6, name: "Kolar APMC", district: "Kolar", state: "Karnataka" },
          ]);
        }
      } catch {
        // Fallback gracefully
        setAvailableMarkets([
          { id: 1, name: "Lasalgaon Mandi", district: "Nashik", state: "Maharashtra" },
          { id: 2, name: "Nashik APMC", district: "Nashik", state: "Maharashtra" },
          { id: 3, name: "Pimpalgaon Mandi", district: "Nashik", state: "Maharashtra" },
          { id: 4, name: "Pune APMC", district: "Pune", state: "Maharashtra" },
          { id: 5, name: "Azadpur Mandi", district: "North Delhi", state: "Delhi" },
          { id: 6, name: "Kolar APMC", district: "Kolar", state: "Karnataka" },
        ]);
      } finally {
        setLoadingMarkets(false);
      }
    }

    loadMarkets();
  }, []);

  const toggleCrop = (cropName: string) => {
    if (selectedCrops.includes(cropName)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== cropName));
      }
    } else {
      setSelectedCrops([...selectedCrops, cropName]);
    }
  };

  const handleAddOtherCrop = () => {
    if (otherCropInput.trim() && !selectedCrops.includes(otherCropInput.trim())) {
      setSelectedCrops([...selectedCrops, otherCropInput.trim()]);
      setOtherCropInput("");
      setShowOtherCrop(false);
    }
  };

  const toggleBuyerCrop = (c: string) => {
    if (buyerCrops.includes(c)) {
      if (buyerCrops.length > 1) setBuyerCrops(buyerCrops.filter((x) => x !== c));
    } else {
      setBuyerCrops([...buyerCrops, c]);
    }
  };

  const toggleFpoCrop = (c: string) => {
    if (fpoCrops.includes(c)) {
      if (fpoCrops.length > 1) setFpoCrops(fpoCrops.filter((x) => x !== c));
    } else {
      setFpoCrops([...fpoCrops, c]);
    }
  };

  const toggleMarket = (mName: string) => {
    if (selectedMarkets.includes(mName)) {
      setSelectedMarkets(selectedMarkets.filter((m) => m !== mName));
    } else {
      setSelectedMarkets([...selectedMarkets, mName]);
    }
  };

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  // ----------------------------------------------------------------
  // COMPLETION HANDLERS
  // ----------------------------------------------------------------
  const handleFarmerComplete = () => {
    const locStr = [village, district, state, country].filter(Boolean).join(", ");
    
    // Update Auth Profile
    updateUserProfile({
      location: locStr || "India",
      district: district || "",
      state: state || "",
      village: village || "",
      landAcreage: `${landValue} ${landUnit}`,
      preferredCrops: selectedCrops,
      onboarded: true,
    });

    // Update App State
    updateOnboardData({
      village: village || "Local Area",
      district: district || state || "India",
      state: state || "India",
      country: "India",
      crops: selectedCrops,
      quantity: `${harvestQty} ${harvestUnit}`,
      quantityUnit: harvestUnit,
      land: `${landValue} ${landUnit}`,
      landUnit,
      markets: selectedMarkets.length > 0 ? selectedMarkets : ["Local Mandi"],
      sellingChannels: selectedChannels,
    });

    showToast("Farmer profile and farm details saved successfully!");
    navigate("/dashboard");
  };

  const handleBuyerComplete = () => {
    const locStr = [buyerDistrict, buyerState, "India"].filter(Boolean).join(", ");

    updateUserProfile({
      location: locStr || "India",
      district: buyerDistrict,
      state: buyerState,
      businessType: buyerBusinessType,
      preferredCrops: buyerCrops,
      procurementRadiusKm: buyerProcRadius,
      verificationStatus: "PENDING",
      onboarded: true,
    });

    updateOnboardData({
      district: buyerDistrict || "India",
      state: buyerState || "India",
      village: "",
      crops: buyerCrops,
      businessType: buyerBusinessType,
      minQuantityQtl: buyerMinQty,
      maxQuantityQtl: buyerMaxQty,
      preferredQuality: buyerQuality,
      indicativePricePerKg: buyerIndicativePrice ? parseFloat(buyerIndicativePrice) : undefined,
      procurementRadiusKm: buyerProcRadius,
      gstOrFssai: buyerGst,
      quantity: `${buyerMinQty}-${buyerMaxQty} Quintals`,
      land: `${buyerProcRadius} km procurement radius`,
      markets: [],
    });

    showToast("Buyer procurement profile submitted! Account is active.");
    navigate("/buyers");
  };

  const handleFpoComplete = () => {
    const locStr = [fpoDistrict, fpoState, "India"].filter(Boolean).join(", ");

    updateUserProfile({
      location: locStr || "India",
      district: fpoDistrict,
      state: fpoState,
      memberFarmerCount: fpoMemberCount,
      landAcreage: `${fpoPooledAcres} acres pooled`,
      preferredCrops: fpoCrops,
      onboarded: true,
    });

    updateOnboardData({
      district: fpoDistrict || "India",
      state: fpoState || "India",
      village: "",
      crops: fpoCrops,
      registrationNumber: fpoRegNo,
      memberFarmerCount: fpoMemberCount,
      pooledAcreage: fpoPooledAcres,
      annualAggregationCapacityTonnes: fpoAnnualCapacity,
      storageAvailable: fpoColdStorage,
      quantity: `${fpoAnnualCapacity} Tonnes Aggregation`,
      land: `${fpoPooledAcres} acres pooled`,
      markets: selectedMarkets,
    });

    showToast("FPO collective dashboard initialized!");
    navigate("/fpo");
  };

  const handleNext = () => {
    if (role === "farmer") {
      if (step === 1) {
        if (!state) {
          alert("Please select your State to configure localized mandi and weather feeds.");
          return;
        }
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleFarmerComplete();
      }
    } else if (role === "buyer") {
      if (step === 1 && !buyerState) {
        alert("Please select your operating State.");
        return;
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleBuyerComplete();
      }
    } else if (role === "fpo") {
      if (step === 1 && !fpoState) {
        alert("Please select your FPO cluster State.");
        return;
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleFpoComplete();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const filteredMarkets = availableMarkets.filter(
    (m) =>
      m.name.toLowerCase().includes(marketSearch.toLowerCase()) ||
      (m.district && m.district.toLowerCase().includes(marketSearch.toLowerCase())) ||
      (m.state && m.state.toLowerCase().includes(marketSearch.toLowerCase()))
  );

  return (
    <div className="onboard-shell">
      <div className="onboard-header">
        <Logo to="/" />
        <div className="flex flex-center gap-md">
          <span className="badge-pill onboard-role-badge">
            {role === "farmer" ? "🌾 Farmer" : role === "fpo" ? "🏢 FPO" : "🛒 Buyer"} Setup
          </span>
          <Link to="/login" className="onboard-switch-link">
            Switch Account
          </Link>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="progress-row" style={{ maxWidth: 600 }}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`progress-step ${n <= step ? "done" : ""}`}
          />
        ))}
      </div>

      <div className="onboard-card card card-pad">
        {/* =================================================================== */}
        {/* FARMER ONBOARDING FLOW (5 STEPS) */}
        {/* =================================================================== */}
        {role === "farmer" && (
          <>
            {/* STEP 1: PAN-INDIA LOCATION */}
            {step === 1 && (
              <div className="onboard-step">
                <div className="onboard-num">STEP 01 OF 05 · PAN-INDIA LOCATION</div>
                <h2>Farm Location & Region</h2>
                <p>
                  Select your state and district to connect with local weather stations and nearby mandis across India.
                </p>

                <div className="field">
                  <label htmlFor="farmer-country">Country</label>
                  <input id="farmer-country" value="India" disabled style={{ background: "#f8f9f7", color: "#555" }} />
                </div>

                <div className="field">
                  <label htmlFor="farmer-state">State / Union Territory <span style={{ color: "var(--danger)" }}>*</span></label>
                  <select
                    id="farmer-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  >
                    <option value="">-- Select Your State / UT --</option>
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="farmer-district">District <span style={{ color: "var(--danger)" }}>*</span></label>
                  {districtList.length > 0 ? (
                    <select
                      id="farmer-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    >
                      {districtList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="farmer-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Nashik, Guntur, or Ludhiana"
                      required
                    />
                  )}
                </div>

                <div className="field">
                  <label htmlFor="farmer-village">Village / Taluka / Town</label>
                  <input
                    id="farmer-village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Niphad / Pimpalgaon / Mandi Town"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: FARM PROFILE & CROPS */}
            {step === 2 && (
              <div className="onboard-step">
                <div className="onboard-num">STEP 02 OF 05 · FARM PROFILE</div>
                <h2>Land Area & Cultivated Crops</h2>
                <p>
                  Select all crops you cultivate to receive specialized stage advisories and price trend alerts.
                </p>

                <div className="land-input-grid">
                  <div className="field">
                    <label htmlFor="land-val">Total Cultivated Land Area</label>
                    <input
                      id="land-val"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={landValue}
                      onChange={(e) => setLandValue(e.target.value)}
                      placeholder="e.g. 2.5"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="land-unit">Unit</label>
                    <select
                      id="land-unit"
                      value={landUnit}
                      onChange={(e) => setLandUnit(e.target.value)}
                    >
                      <option value="Acres">Acres</option>
                      <option value="Hectares">Hectares</option>
                      <option value="Bigha">Bigha</option>
                      <option value="Guntha">Guntha</option>
                    </select>
                  </div>
                </div>

                <label className="crop-select-label">
                  Select Crops (Multiple Allowed):
                </label>
                <div className="chip-grid mb-lg">
                  {ALL_SUPPORTED_CROPS.map((c) => {
                    const isSelected = selectedCrops.includes(c.name);
                    return (
                      <div
                        key={c.name}
                        className={`chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleCrop(c.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <span style={{ marginRight: 4 }}>{c.emoji}</span>
                        {c.name}
                        {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Other Crop Button / Input */}
                {!showOtherCrop ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowOtherCrop(true)}
                  >
                    + Add Other Crop
                  </button>
                ) : (
                  <div className="other-crop-row">
                    <input
                      value={otherCropInput}
                      onChange={(e) => setOtherCropInput(e.target.value)}
                      placeholder="Enter crop name (e.g. Soybean, Mustard)"
                      style={{ maxWidth: 260 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddOtherCrop}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowOtherCrop(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PRODUCTION & HARVEST EXPECTATION */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 05 · PRODUCTION EXPECTATIONS</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Expected Harvest Volume</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Estimated volume helps the AI calculate net realization per kg after freight and market fees.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 16 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="harvest-qty">Average Seasonal Volume</label>
                    <input
                      id="harvest-qty"
                      type="number"
                      step="1"
                      min="1"
                      value={harvestQty}
                      onChange={(e) => setHarvestQty(e.target.value)}
                      placeholder="e.g. 500"
                      required
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="harvest-unit">Volume Unit</label>
                    <select
                      id="harvest-unit"
                      value={harvestUnit}
                      onChange={(e) => setHarvestUnit(e.target.value)}
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="quintal">Quintals (100 kg)</option>
                      <option value="tonnes">Metric Tonnes (MT)</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="sowing-season">Current Agricultural Season / Stage</label>
                  <select
                    id="sowing-season"
                    value={sowingSeason}
                    onChange={(e) => setSowingSeason(e.target.value)}
                  >
                    <option value="Kharif Season">Kharif Season (Monsoon Sowing)</option>
                    <option value="Rabi Season">Rabi Season (Winter Sowing)</option>
                    <option value="Zaid Season">Zaid Season (Summer Sowing)</option>
                    <option value="Near Maturity / Ready to Harvest">Near Maturity / Ready to Harvest</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: SELLING PREFERENCES & MANDIS */}
            {step === 4 && (
              <div>
                <div className="onboard-num">STEP 04 OF 05 · SELLING PREFERENCES & MARKETS</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Channels & Preferred Mandis</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "16px" }}>
                  Choose the channels you prefer to sell through and the mandis you want real-time price tracking for.
                </p>

                <label style={{ fontSize: 13.5, fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Preferred Selling Channels:
                </label>
                <div className="chip-grid" style={{ marginBottom: 20 }}>
                  {SELLING_CHANNELS.map((ch) => {
                    const isSelected = selectedChannels.includes(ch);
                    return (
                      <div
                        key={ch}
                        className={`chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleChannel(ch)}
                        role="button"
                        tabIndex={0}
                      >
                        {ch} {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 700 }}>
                    Tracked Mandis & Markets (Optional):
                  </label>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {loadingMarkets ? "Loading mandis…" : `${availableMarkets.length} mandis available`}
                  </span>
                </div>

                {/* Market Search Box */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    placeholder="Search mandi name or district…"
                    style={{ paddingLeft: 34 }}
                  />
                  <Search size={16} color="var(--ink-soft)" style={{ position: "absolute", left: 10, top: 12 }} />
                </div>

                <div className="chip-grid" style={{ maxHeight: 160, overflowY: "auto", padding: 2 }}>
                  {filteredMarkets.map((m) => {
                    const isSelected = selectedMarkets.includes(m.name);
                    return (
                      <div
                        key={m.id}
                        className={`chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleMarket(m.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <Store size={14} style={{ display: "inline", marginRight: 4 }} />
                        {m.name}
                        {m.district ? ` (${m.district})` : ""}
                        {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: SUMMARY & COMPLETION */}
            {step === 5 && (
              <div>
                <div className="onboard-num">STEP 05 OF 05 · COMPLETE SETUP</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Farm Profile Summary</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Review your farm profile details. You can update these anytime in Profile & Settings.
                </p>

                <div
                  style={{
                    background: "var(--cream)",
                    border: "1px solid #EADBBE",
                    borderRadius: 10,
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13.5 }}>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>LOCATION</strong>
                      <span>{[village, district, state, "India"].filter(Boolean).join(", ")}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>LAND UNDER CULTIVATION</strong>
                      <span>{landValue} {landUnit}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>CULTIVATED CROPS</strong>
                      <span>{selectedCrops.join(", ")}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>SEASONAL VOLUME</strong>
                      <span>{harvestQty} {harvestUnit} ({sowingSeason})</span>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>SELLING CHANNELS & MARKETS</strong>
                      <span>
                        Channels: {selectedChannels.join(", ")}
                        <br />
                        Tracked Mandis: {selectedMarkets.length > 0 ? selectedMarkets.join(", ") : "All nearby mandis"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green-deep)", fontSize: 13.5 }}>
                  <ShieldCheck size={18} />
                  <span>Ready to generate AI price discovery and decision recommendations.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* BUYER ONBOARDING FLOW (3 STEPS) */}
        {/* =================================================================== */}
        {role === "buyer" && (
          <>
            {/* BUYER STEP 1: BUSINESS PROFILE & LOCATION */}
            {step === 1 && (
              <div>
                <div className="onboard-num">STEP 01 OF 03 · BUSINESS PROFILE</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Procurement Hub & Business Type</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Configure your procurement operations to receive matched produce lots from verified farmers.
                </p>

                <div className="field">
                  <label htmlFor="buyer-type">Business Category</label>
                  <select
                    id="buyer-type"
                    value={buyerBusinessType}
                    onChange={(e) => setBuyerBusinessType(e.target.value)}
                  >
                    {BUYER_BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="buyer-state">Primary Procurement State <span style={{ color: "var(--danger)" }}>*</span></label>
                  <select
                    id="buyer-state"
                    value={buyerState}
                    onChange={(e) => setBuyerState(e.target.value)}
                    required
                  >
                    <option value="">-- Select Operating State --</option>
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="buyer-district">District / City</label>
                  <input
                    id="buyer-district"
                    value={buyerDistrict}
                    onChange={(e) => setBuyerDistrict(e.target.value)}
                    placeholder="e.g. Pune, Nashik, Hyderabad, Delhi"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="buyer-radius">Procurement Radius (km): {buyerProcRadius} km</label>
                  <input
                    id="buyer-radius"
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={buyerProcRadius}
                    onChange={(e) => setBuyerProcRadius(parseInt(e.target.value))}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-soft)" }}>
                    <span>20 km (Local)</span>
                    <span>150 km (Regional)</span>
                    <span>500 km (Interstate)</span>
                  </div>
                </div>
              </div>
            )}

            {/* BUYER STEP 2: CROP DEMAND & PROCUREMENT SPECS */}
            {step === 2 && (
              <div>
                <div className="onboard-num">STEP 02 OF 03 · CROP DEMAND & SPECS</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Procured Crops & Volume Scale</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "16px" }}>
                  Select the commodities you procure and your typical lot volume parameters.
                </p>

                <label style={{ fontSize: 13.5, fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Commodities Procured (Multiple Allowed):
                </label>
                <div className="chip-grid" style={{ marginBottom: 18 }}>
                  {ALL_SUPPORTED_CROPS.map((c) => {
                    const isSelected = buyerCrops.includes(c.name);
                    return (
                      <div
                        key={c.name}
                        className={`chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleBuyerCrop(c.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <span style={{ marginRight: 4 }}>{c.emoji}</span>
                        {c.name}
                        {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="buyer-min-qty">Min Lot Size (Quintals)</label>
                    <input
                      id="buyer-min-qty"
                      type="number"
                      min="1"
                      value={buyerMinQty}
                      onChange={(e) => setBuyerMinQty(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="buyer-max-qty">Max Lot Size (Quintals)</label>
                    <input
                      id="buyer-max-qty"
                      type="number"
                      min="1"
                      value={buyerMaxQty}
                      onChange={(e) => setBuyerMaxQty(parseFloat(e.target.value) || 100)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="buyer-grade">Preferred Quality Grade</label>
                  <select
                    id="buyer-grade"
                    value={buyerQuality}
                    onChange={(e) => setBuyerQuality(e.target.value)}
                  >
                    {QUALITY_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="buyer-price">Indicative Buying Price (₹/kg, Optional)</label>
                  <input
                    id="buyer-price"
                    type="number"
                    step="0.5"
                    value={buyerIndicativePrice}
                    onChange={(e) => setBuyerIndicativePrice(e.target.value)}
                    placeholder="e.g. 31"
                  />
                </div>
              </div>
            )}

            {/* BUYER STEP 3: VERIFICATION STATUS & COMPLETION */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 03 · VERIFICATION & COMPLIANCE</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Buyer Verification Status</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  All newly registered buyers are initialized in unverified/pending state until business registration is reviewed.
                </p>

                <div
                  style={{
                    background: "#FEF3C7",
                    border: "1px solid #FCD34D",
                    borderRadius: 8,
                    padding: "14px",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <ShieldCheck size={20} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.5 }}>
                    <strong>Verification Status: PENDING KYC REVIEW</strong>
                    <p style={{ margin: "4px 0 0" }}>
                      You can immediately explore farmer lots and create purchase orders. Full verified badge will be activated upon GSTIN/FSSAI verification.
                    </p>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="buyer-gst">GSTIN / FSSAI / Business Reg. No. (Optional)</label>
                  <input
                    id="buyer-gst"
                    value={buyerGst}
                    onChange={(e) => setBuyerGst(e.target.value)}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                  />
                </div>

                <div
                  style={{
                    background: "var(--cream)",
                    border: "1px solid #EADBBE",
                    borderRadius: 8,
                    padding: "14px",
                    fontSize: 13.5,
                  }}
                >
                  <strong>Summary:</strong> {user.name} ({buyerBusinessType}) · Hub: {buyerDistrict}, {buyerState} · Crops: {buyerCrops.join(", ")}
                </div>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* FPO ONBOARDING FLOW (3 STEPS) */}
        {/* =================================================================== */}
        {role === "fpo" && (
          <>
            {/* FPO STEP 1: REGISTRATION & LOCATION */}
            {step === 1 && (
              <div>
                <div className="onboard-num">STEP 01 OF 03 · FPO PROFILE</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>FPO Registration & Cluster Location</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Provide organization details to enable aggregated lot pooling and shared logistics.
                </p>

                <div className="field">
                  <label htmlFor="fpo-reg">FPO Registration / CIN Number</label>
                  <input
                    id="fpo-reg"
                    value={fpoRegNo}
                    onChange={(e) => setFpoRegNo(e.target.value)}
                    placeholder="e.g. U01100MH2022PTC123456"
                  />
                </div>

                <div className="field">
                  <label htmlFor="fpo-state">Cluster State <span style={{ color: "var(--danger)" }}>*</span></label>
                  <select
                    id="fpo-state"
                    value={fpoState}
                    onChange={(e) => setFpoState(e.target.value)}
                    required
                  >
                    <option value="">-- Select State --</option>
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="fpo-district">Cluster District</label>
                  <input
                    id="fpo-district"
                    value={fpoDistrict}
                    onChange={(e) => setFpoDistrict(e.target.value)}
                    placeholder="e.g. Nashik, Warangal, Sangli"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="fpo-members">Number of Member Farmers</label>
                  <input
                    id="fpo-members"
                    type="number"
                    min="10"
                    value={fpoMemberCount}
                    onChange={(e) => setFpoMemberCount(parseInt(e.target.value) || 50)}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
            )}

            {/* FPO STEP 2: CROPS & CAPACITY */}
            {step === 2 && (
              <div>
                <div className="onboard-num">STEP 02 OF 03 · AGGREGATION CAPACITY</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Aggregated Crops & Pooled Acreage</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "16px" }}>
                  Select the core commodities aggregated by your FPO collective.
                </p>

                <label style={{ fontSize: 13.5, fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Aggregated Commodities (Multiple Allowed):
                </label>
                <div className="chip-grid" style={{ marginBottom: 18 }}>
                  {ALL_SUPPORTED_CROPS.map((c) => {
                    const isSelected = fpoCrops.includes(c.name);
                    return (
                      <div
                        key={c.name}
                        className={`chip ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleFpoCrop(c.name)}
                        role="button"
                        tabIndex={0}
                      >
                        <span style={{ marginRight: 4 }}>{c.emoji}</span>
                        {c.name}
                        {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="fpo-acres">Total Pooled Acreage</label>
                    <input
                      id="fpo-acres"
                      type="number"
                      min="10"
                      value={fpoPooledAcres}
                      onChange={(e) => setFpoPooledAcres(parseFloat(e.target.value) || 100)}
                      placeholder="e.g. 250 acres"
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="fpo-cap">Annual Capacity (Tonnes)</label>
                    <input
                      id="fpo-cap"
                      type="number"
                      min="10"
                      value={fpoAnnualCapacity}
                      onChange={(e) => setFpoAnnualCapacity(parseFloat(e.target.value) || 500)}
                      placeholder="e.g. 1200 MT"
                    />
                  </div>
                </div>

                <div className="field" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <input
                    id="fpo-cold"
                    type="checkbox"
                    checked={fpoColdStorage}
                    onChange={(e) => setFpoColdStorage(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="fpo-cold" style={{ margin: 0, fontWeight: 600, cursor: "pointer" }}>
                    FPO operates warehouse or cold storage aggregation facility
                  </label>
                </div>
              </div>
            )}

            {/* FPO STEP 3: LINKAGES & COMPLETION */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 03 · LINKAGES & SETUP COMPLETE</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Market Linkages & Setup</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Your FPO collective dashboard is configured to pool farmer lots, negotiate bulk corporate tenders, and track shared trucking.
                </p>

                <div
                  style={{
                    background: "var(--cream)",
                    border: "1px solid #EADBBE",
                    borderRadius: 10,
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13.5 }}>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>FPO NAME</strong>
                      <span>{user.name}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>CLUSTER</strong>
                      <span>{fpoDistrict}, {fpoState}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>MEMBERS & ACREAGE</strong>
                      <span>{fpoMemberCount} Farmers ({fpoPooledAcres} Acres)</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}>COMMODITIES</strong>
                      <span>{fpoCrops.join(", ")}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green-deep)", fontSize: 13.5 }}>
                  <Building2 size={18} />
                  <span>Ready to access FPO collective bargaining and bulk aggregation tools.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "28px",
            paddingTop: "16px",
            borderTop: "1px solid var(--line)",
          }}
        >
          {step > 1 ? (
            <button className="btn btn-ghost" type="button" onClick={handleBack}>
              <ArrowLeft size={16} /> {t("onboarding.back")}
            </button>
          ) : (
            <div />
          )}

          <button className="btn btn-primary" type="button" onClick={handleNext}>
            {step < totalSteps ? (
              <>
                {t("onboarding.continue")} <ArrowRight size={16} />
              </>
            ) : (
              t("onboarding.complete")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
