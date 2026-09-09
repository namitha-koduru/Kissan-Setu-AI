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
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import { apiClient } from "../services/api";
import { ALL_INDIAN_STATES, getDistrictsForState } from "../data/indiaLocations";
import { MASTER_CROP_CATALOG, CROP_CATEGORIES } from "../data/cropCatalog";

const ALL_SUPPORTED_CROPS = MASTER_CROP_CATALOG.map((c) => ({
  name: c.name,
  emoji: c.icon,
  category: c.category,
}));

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

const FPO_ORG_TYPES = [
  "Farmer Producer Company (FPC)",
  "Primary Agricultural Credit Society (PACS)",
  "Cooperative Marketing Society",
  "Self-Help Group Federation (SHG)",
  "Producer Association / Trust",
];

const STORAGE_TYPES = [
  "Dry Ambient Warehouse",
  "Temperature-Controlled Cold Storage",
  "Grain Silo Storage",
  "Hermetic Cocoon Storage",
  "Open Covered Aggregation Yard",
];

const GRADING_CAPABILITIES = [
  "Manual Sorting & Grading",
  "Optical / Machine Color Grader",
  "Lab Tested & ICAR Certified",
  "Basic Fair Average Quality (FAQ) Screening",
];

const PAYMENT_TERMS_LIST = [
  "Immediate T+0 Escrow Settlement",
  "T+1 Verified Bank Transfer",
  "T+3 Upon Delivery & Weight Inspection",
  "20% Advance + 80% on Dispatch",
];

const SETTLEMENT_METHODS = [
  "NEFT / RTGS Bank Transfer",
  "UPI / Instant Digital Payment",
  "Direct Escrow Guarantee",
  "Letter of Credit / Bank Guarantee",
];

const PROCUREMENT_FREQUENCIES = [
  "Daily / Continuous Procurement",
  "Weekly Recurring Orders",
  "Bi-weekly Batch Orders",
  "Seasonal Contract Fulfillment",
];

const QUALITY_GRADES = [
  "Grade A (Premium / Export Quality)",
  "Grade B+ (Standard Commercial)",
  "Processing Grade (Industrial / Pulping)",
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

  // Farmer has 5 steps, FPO has 4 steps, Buyer has 4 steps
  const totalSteps = role === "farmer" ? 5 : 4;
  const [step, setStep] = useState(1);

  // ----------------------------------------------------------------
  // FARMER STATE
  // ----------------------------------------------------------------
  const [country] = useState("India");
  const [farmerState, setFarmerState] = useState(user.state || "");
  const [farmerDistrict, setFarmerDistrict] = useState(user.district || "");
  const [farmerVillage, setFarmerVillage] = useState(user.village || "");
  const [farmerDistrictList, setFarmerDistrictList] = useState<string[]>([]);

  const [landValue, setLandValue] = useState(
    user.landAcreage ? String(user.landAcreage).split(" ")[0] : ""
  );
  const [landUnit, setLandUnit] = useState("Acres");
  const initialCrops =
    Array.isArray(user.preferredCrops) && user.preferredCrops.length > 0
      ? user.preferredCrops
      : [];
  const [selectedCrops, setSelectedCrops] = useState<string[]>(initialCrops);
  const [cropAllocations, setCropAllocations] = useState<Record<string, number | "">>(() => {
    if (user.cropAllocations && user.cropAllocations.length > 0) {
      const map: Record<string, number | ""> = {};
      user.cropAllocations.forEach((a) => {
        map[a.crop] = a.area;
      });
      return map;
    }
    return {};
  });
  const [cropCategoryFilter, setCropCategoryFilter] = useState("All");
  const [cropSearchTerm, setCropSearchTerm] = useState("");
  const [otherCropInput, setOtherCropInput] = useState("");
  const [showOtherCrop, setShowOtherCrop] = useState(false);

  // Unit conversion helper for Farmer Land
  const UNIT_IN_ACRES: Record<string, number> = {
    Acres: 1.0,
    Hectares: 2.47105,
    Bigha: 0.625,
    Guntha: 0.025,
  };

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === landUnit) return;
    const factor = (UNIT_IN_ACRES[landUnit] || 1.0) / (UNIT_IN_ACRES[newUnit] || 1.0);

    if (landValue && !isNaN(Number(landValue))) {
      const convertedLand = parseFloat((Number(landValue) * factor).toFixed(2));
      setLandValue(String(convertedLand));
    }

    setCropAllocations((prev) => {
      const next: Record<string, number | ""> = {};
      for (const [c, val] of Object.entries(prev)) {
        if (val !== "" && typeof val === "number" && !isNaN(val)) {
          next[c] = parseFloat((val * factor).toFixed(2));
        } else {
          next[c] = val;
        }
      }
      return next;
    });

    setLandUnit(newUnit);
  };

  // Farmer Dynamic Allocation Calculations
  const totalLandNum = parseFloat(landValue) || 0;
  const allocatedLandNum = parseFloat(
    selectedCrops
      .reduce((sum, c) => {
        const val = cropAllocations[c];
        return sum + (typeof val === "number" ? val : parseFloat(String(val)) || 0);
      }, 0)
      .toFixed(2)
  );
  const remainingLandNum = parseFloat(Math.max(0, totalLandNum - allocatedLandNum).toFixed(2));
  const isAllocationExceeded = totalLandNum > 0 && allocatedLandNum > totalLandNum + 0.001;
  const isFullyAllocated = totalLandNum > 0 && Math.abs(allocatedLandNum - totalLandNum) < 0.001;

  const [harvestQty, setHarvestQty] = useState("");
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
  // FPO STATE (4 STEPS)
  // ----------------------------------------------------------------
  const [fpoOrgName, setFpoOrgName] = useState(user.name || "");
  const [fpoAuthPerson, setFpoAuthPerson] = useState(user.contactPerson || "");
  const [fpoRegNo, setFpoRegNo] = useState("");
  const [fpoOrgType, setFpoOrgType] = useState(FPO_ORG_TYPES[0]);
  const [fpoYearEst, setFpoYearEst] = useState("2021");

  const [fpoState, setFpoState] = useState(user.state || "");
  const [fpoDistrict, setFpoDistrict] = useState(user.district || "");
  const [fpoVillage, setFpoVillage] = useState(user.village || "");
  const [fpoDistrictList, setFpoDistrictList] = useState<string[]>([]);
  const [fpoMemberCount, setFpoMemberCount] = useState(250);
  const [fpoActiveProducers, setFpoActiveProducers] = useState(180);

  const [fpoCrops, setFpoCrops] = useState<string[]>(["Cotton", "Chilli", "Tomato"]);
  const [fpoAnnualCapacity, setFpoAnnualCapacity] = useState(1500);
  const [fpoStorageCapacity, setFpoStorageCapacity] = useState(500);
  const [fpoStorageType, setFpoStorageType] = useState(STORAGE_TYPES[0]);
  const [fpoCollectionCenters, setFpoCollectionCenters] = useState(3);
  const [fpoGradingCapability, setFpoGradingCapability] = useState(GRADING_CAPABILITIES[0]);

  const [fpoMandisServed, setFpoMandisServed] = useState<string[]>([
    "Guntur Mirchi Yard",
    "Warangal Mandi",
    "Khammam Market",
  ]);
  const [fpoBuyerRelations, setFpoBuyerRelations] = useState(
    "ITC Agri-Business, BigBasket, Reliance Fresh, Local Exporters"
  );
  const [fpoHasInstitutionalContracts, setFpoHasInstitutionalContracts] = useState(true);
  const [fpoProcurementRegions, setFpoProcurementRegions] = useState(
    "Telangana, Andhra Pradesh, Maharashtra"
  );

  // ----------------------------------------------------------------
  // BUYER STATE (4 STEPS)
  // ----------------------------------------------------------------
  const [buyerOrgName, setBuyerOrgName] = useState(user.name || "");
  const [buyerContactPerson, setBuyerContactPerson] = useState(user.contactPerson || "");
  const [buyerBusinessType, setBuyerBusinessType] = useState(BUYER_BUSINESS_TYPES[0]);
  const [buyerGst, setBuyerGst] = useState("");
  const [buyerFssai, setBuyerFssai] = useState("");

  const [buyerState, setBuyerState] = useState(user.state || "");
  const [buyerDistrict, setBuyerDistrict] = useState(user.district || "");
  const [buyerCity, setBuyerCity] = useState(user.village || "");
  const [buyerDistrictList, setBuyerDistrictList] = useState<string[]>([]);
  const [buyerProcRadius, setBuyerProcRadius] = useState(150);

  const [buyerCrops, setBuyerCrops] = useState<string[]>(["Tomato", "Onion", "Chilli"]);
  const [buyerMinQty, setBuyerMinQty] = useState(25);
  const [buyerMaxQty, setBuyerMaxQty] = useState(500);
  const [buyerQuality, setBuyerQuality] = useState(QUALITY_GRADES[0]);
  const [buyerIndicativePrice, setBuyerIndicativePrice] = useState("32");
  const [buyerQualityRequirements, setBuyerQualityRequirements] = useState(
    "Moisture < 12%, Organic Certified / Export Quality, Max 2% Foreign Matter"
  );

  const [buyerPaymentTerms, setBuyerPaymentTerms] = useState(PAYMENT_TERMS_LIST[0]);
  const [buyerSettlementMethod, setBuyerSettlementMethod] = useState(SETTLEMENT_METHODS[0]);
  const [buyerProcFrequency, setBuyerProcFrequency] = useState(PROCUREMENT_FREQUENCIES[1]);

  // District synchronization for Farmer
  useEffect(() => {
    if (farmerState) {
      const dList = getDistrictsForState(farmerState);
      setFarmerDistrictList(dList);
      if (!dList.includes(farmerDistrict)) {
        setFarmerDistrict(dList[0] || "");
      }
    } else {
      setFarmerDistrictList([]);
    }
  }, [farmerState]);

  // District synchronization for FPO
  useEffect(() => {
    if (fpoState) {
      const dList = getDistrictsForState(fpoState);
      setFpoDistrictList(dList);
      if (!dList.includes(fpoDistrict)) {
        setFpoDistrict(dList[0] || "");
      }
    } else {
      setFpoDistrictList([]);
    }
  }, [fpoState]);

  // District synchronization for Buyer
  useEffect(() => {
    if (buyerState) {
      const dList = getDistrictsForState(buyerState);
      setBuyerDistrictList(dList);
      if (!dList.includes(buyerDistrict)) {
        setBuyerDistrict(dList[0] || "");
      }
    } else {
      setBuyerDistrictList([]);
    }
  }, [buyerState]);

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
          if (selectedMarkets.length === 0 && list[0]) {
            setSelectedMarkets([list[0].name]);
          }
        } else {
          setAvailableMarkets([
            { id: 1, name: "Lasalgaon Mandi", district: "Nashik", state: "Maharashtra" },
            { id: 2, name: "Nashik APMC", district: "Nashik", state: "Maharashtra" },
            { id: 3, name: "Pimpalgaon Mandi", district: "Nashik", state: "Maharashtra" },
            { id: 4, name: "Pune APMC", district: "Pune", state: "Maharashtra" },
            { id: 5, name: "Guntur Mirchi Yard", district: "Guntur", state: "Andhra Pradesh" },
            { id: 6, name: "Warangal Enumamula Mandi", district: "Warangal", state: "Telangana" },
            { id: 7, name: "Azadpur Mandi", district: "North Delhi", state: "Delhi" },
            { id: 8, name: "Kolar APMC", district: "Kolar", state: "Karnataka" },
          ]);
        }
      } catch {
        setAvailableMarkets([
          { id: 1, name: "Lasalgaon Mandi", district: "Nashik", state: "Maharashtra" },
          { id: 2, name: "Nashik APMC", district: "Nashik", state: "Maharashtra" },
          { id: 3, name: "Pimpalgaon Mandi", district: "Nashik", state: "Maharashtra" },
          { id: 4, name: "Pune APMC", district: "Pune", state: "Maharashtra" },
          { id: 5, name: "Guntur Mirchi Yard", district: "Guntur", state: "Andhra Pradesh" },
          { id: 6, name: "Warangal Enumamula Mandi", district: "Warangal", state: "Telangana" },
          { id: 7, name: "Azadpur Mandi", district: "North Delhi", state: "Delhi" },
          { id: 8, name: "Kolar APMC", district: "Kolar", state: "Karnataka" },
        ]);
      } finally {
        setLoadingMarkets(false);
      }
    }

    loadMarkets();
  }, []);

  // Toggles for crops
  const toggleCrop = (cropName: string) => {
    if (selectedCrops.includes(cropName)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== cropName));
        setCropAllocations((prev) => {
          const next = { ...prev };
          delete next[cropName];
          return next;
        });
      }
    } else {
      setSelectedCrops([...selectedCrops, cropName]);
      setCropAllocations((prev) => ({
        ...prev,
        [cropName]: "",
      }));
    }
  };

  const handleAddOtherCrop = () => {
    const trimmed = otherCropInput.trim();
    if (trimmed) {
      if (!selectedCrops.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        setSelectedCrops([...selectedCrops, trimmed]);
        setCropAllocations((prev) => ({
          ...prev,
          [trimmed]: "",
        }));
      }
      setOtherCropInput("");
      setShowOtherCrop(false);
    }
  };

  const handleRemoveCustomCrop = (cropName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCrops.length > 1) {
      setSelectedCrops(selectedCrops.filter((c) => c !== cropName));
      setCropAllocations((prev) => {
        const next = { ...prev };
        delete next[cropName];
        return next;
      });
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
    const locStr = [farmerVillage, farmerDistrict, farmerState, country].filter(Boolean).join(", ");

    const formattedAllocations = selectedCrops.map((c) => ({
      crop: c,
      area:
        typeof cropAllocations[c] === "number"
          ? (cropAllocations[c] as number)
          : parseFloat(String(cropAllocations[c])) || 0,
      unit: landUnit,
    }));

    updateUserProfile({
      location: locStr || "India",
      district: farmerDistrict || "",
      state: farmerState || "",
      village: farmerVillage || "",
      landAcreage: `${landValue} ${landUnit}`,
      preferredCrops: selectedCrops,
      cropAllocations: formattedAllocations,
      onboarded: true,
    });

    updateOnboardData({
      village: farmerVillage || "Local Area",
      district: farmerDistrict || farmerState || "India",
      state: farmerState || "India",
      country: "India",
      crops: selectedCrops,
      cropAllocations: formattedAllocations,
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

  const handleFpoComplete = () => {
    const locStr = [fpoVillage, fpoDistrict, fpoState, "India"].filter(Boolean).join(", ");

    updateUserProfile({
      name: fpoOrgName || user.name,
      contactPerson: fpoAuthPerson || user.contactPerson,
      location: locStr || "India",
      district: fpoDistrict,
      state: fpoState,
      village: fpoVillage,
      memberFarmerCount: fpoMemberCount,
      preferredCrops: fpoCrops,
      onboarded: true,
    });

    updateOnboardData({
      district: fpoDistrict || "India",
      state: fpoState || "India",
      village: fpoVillage || "",
      crops: fpoCrops,
      registrationNumber: fpoRegNo,
      memberFarmerCount: fpoMemberCount,
      annualAggregationCapacityTonnes: fpoAnnualCapacity,
      storageCapacityTonnes: fpoStorageCapacity,
      storageType: fpoStorageType,
      collectionCentersCount: fpoCollectionCenters,
      gradingCapability: fpoGradingCapability,
      marketsServed: fpoMandisServed,
      buyerRelationships: fpoBuyerRelations,
      institutionalContracts: fpoHasInstitutionalContracts,
      procurementRegions: fpoProcurementRegions,
      quantity: `${fpoAnnualCapacity} Tonnes Aggregation`,
      land: `${fpoMemberCount} Member Farmers`,
      markets: fpoMandisServed,
    });

    showToast("FPO organization profile initialized successfully!");
    navigate("/fpo");
  };

  const handleBuyerComplete = () => {
    const locStr = [buyerCity, buyerDistrict, buyerState, "India"].filter(Boolean).join(", ");

    updateUserProfile({
      name: buyerOrgName || user.name,
      contactPerson: buyerContactPerson || user.contactPerson,
      location: locStr || "India",
      district: buyerDistrict,
      state: buyerState,
      village: buyerCity,
      businessType: buyerBusinessType,
      preferredCrops: buyerCrops,
      procurementRadiusKm: buyerProcRadius,
      verificationStatus: "PENDING",
      onboarded: true,
    });

    updateOnboardData({
      district: buyerDistrict || "India",
      state: buyerState || "India",
      village: buyerCity || "",
      crops: buyerCrops,
      businessType: buyerBusinessType,
      minQuantityQtl: buyerMinQty,
      maxQuantityQtl: buyerMaxQty,
      preferredQuality: buyerQuality,
      indicativePricePerKg: buyerIndicativePrice ? parseFloat(buyerIndicativePrice) : undefined,
      procurementRadiusKm: buyerProcRadius,
      gstOrFssai: buyerGst || buyerFssai,
      qualityRequirements: buyerQualityRequirements,
      paymentTerms: buyerPaymentTerms,
      settlementMethod: buyerSettlementMethod,
      procurementFrequency: buyerProcFrequency,
      quantity: `${buyerMinQty}-${buyerMaxQty} Quintals`,
      land: `${buyerProcRadius} km procurement radius`,
      markets: [],
    });

    showToast("Buyer procurement profile submitted! Portal is active.");
    navigate("/buyers");
  };

  const handleNext = () => {
    if (role === "farmer") {
      if (step === 1 && !farmerState) {
        alert("Please select your State to configure localized mandi and weather feeds.");
        return;
      }
      if (step === 2 && isAllocationExceeded) {
        alert(
          `Crop allocation exceeds your total cultivated land by ${(allocatedLandNum - totalLandNum).toFixed(1)} ${landUnit}. Please adjust crop acreage before proceeding.`
        );
        return;
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleFarmerComplete();
      }
    } else if (role === "fpo") {
      if (step === 1 && !fpoOrgName) {
        alert("Please enter your Organization / FPO Name.");
        return;
      }
      if (step === 2 && !fpoState) {
        alert("Please select your FPO cluster State.");
        return;
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleFpoComplete();
      }
    } else if (role === "buyer") {
      if (step === 1 && !buyerOrgName) {
        alert("Please enter your Procurement Organization Name.");
        return;
      }
      if (step === 2 && !buyerState) {
        alert("Please select your primary operating State.");
        return;
      }
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleBuyerComplete();
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
      {/* Top Header */}
      <div className="onboard-header">
        <Logo to="/" />
        <div className="flex flex-center gap-md">
          <span
            className="badge-pill onboard-role-badge"
            style={{
              fontWeight: 800,
              fontSize: "13px",
              padding: "6px 14px",
              borderRadius: "20px",
              background:
                role === "farmer"
                  ? "rgba(23,107,69,0.1)"
                  : role === "fpo"
                  ? "rgba(11,37,69,0.1)"
                  : "rgba(217,119,6,0.12)",
              color:
                role === "farmer"
                  ? "var(--green-deep)"
                  : role === "fpo"
                  ? "var(--navy)"
                  : "#B45309",
              border:
                role === "farmer"
                  ? "1px solid rgba(23,107,69,0.25)"
                  : role === "fpo"
                  ? "1px solid rgba(11,37,69,0.25)"
                  : "1px solid rgba(217,119,6,0.3)",
            }}
          >
            {role === "farmer"
              ? "🌱 FARMER SETUP"
              : role === "fpo"
              ? "🏢 FPO SETUP"
              : "🏪 BUYER SETUP"}
          </span>
          <Link to="/login" className="onboard-switch-link">
            Switch Account
          </Link>
        </div>
      </div>

      {/* Role Tagline */}
      <div style={{ textAlign: "center", marginBottom: "16px", marginTop: "-4px" }}>
        <p style={{ fontSize: "14px", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
          {role === "farmer"
            ? t("onboarding.farmerTagline", "Connect your farm to better markets.")
            : role === "fpo"
            ? t("onboarding.fpoTagline", "Organize your members, aggregate produce and connect with buyers.")
            : t("onboarding.buyerTagline", "Source verified produce from farmers and FPOs.")}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-row" style={{ maxWidth: 600 }}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div key={n} className={`progress-step ${n <= step ? "done" : ""}`} />
        ))}
      </div>

      <div className="onboard-card card card-pad">
        {/* =================================================================== */}
        {/* FARMER ONBOARDING FLOW (5 STEPS)                                     */}
        {/* =================================================================== */}
        {role === "farmer" && (
          <>
            {/* STEP 1: FARM LOCATION & REGION */}
            {step === 1 && (
              <div className="onboard-step">
                <div className="onboard-num">STEP 01 OF 05 · PAN-INDIA LOCATION</div>
                <h2>Farm Location & Region</h2>
                <p>
                  Select your state and district to connect with local weather stations and nearby mandis across India.
                </p>

                <div className="field">
                  <label htmlFor="farmer-country">Country</label>
                  <input
                    id="farmer-country"
                    value="India"
                    disabled
                    style={{ background: "#f8f9f7", color: "#555" }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="farmer-state">
                    State / Union Territory <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="farmer-state"
                    value={farmerState}
                    onChange={(e) => setFarmerState(e.target.value)}
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
                  <label htmlFor="farmer-district">
                    District <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  {farmerDistrictList.length > 0 ? (
                    <select
                      id="farmer-district"
                      value={farmerDistrict}
                      onChange={(e) => setFarmerDistrict(e.target.value)}
                      required
                    >
                      {farmerDistrictList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="farmer-district"
                      value={farmerDistrict}
                      onChange={(e) => setFarmerDistrict(e.target.value)}
                      placeholder="e.g. Nashik, Guntur, or Ludhiana"
                      required
                    />
                  )}
                </div>

                <div className="field">
                  <label htmlFor="farmer-village">Village / Taluka / Town</label>
                  <input
                    id="farmer-village"
                    value={farmerVillage}
                    onChange={(e) => setFarmerVillage(e.target.value)}
                    placeholder="e.g. Niphad / Pimpalgaon / Mandi Town"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: LAND AREA & CULTIVATED CROPS */}
            {step === 2 && (
              <div className="onboard-step">
                <div className="onboard-num">STEP 02 OF 05 · LAND & CULTIVATED CROPS</div>
                <h2>Land Area & Cultivated Crops</h2>
                <p>
                  Select all crops you cultivate and specify acreage to receive specialized stage advisories and price alerts.
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
                      placeholder="e.g. 5.0"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="land-unit">Unit</label>
                    <select
                      id="land-unit"
                      value={landUnit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                    >
                      <option value="Acres">Acres</option>
                      <option value="Hectares">Hectares</option>
                      <option value="Bigha">Bigha</option>
                      <option value="Guntha">Guntha</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <label className="crop-select-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                    Select Crops ({selectedCrops.length} selected):
                  </label>

                  {/* High Quality Search Bar */}
                  <div style={{ position: "relative", minWidth: 220, flex: "1 1 220px" }}>
                    <Search
                      size={15}
                      color="var(--ink-soft)"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder={t("onboarding.searchCrop", "Search crop (e.g. Cotton, Tomato)...")}
                      value={cropSearchTerm}
                      onChange={(e) => setCropSearchTerm(e.target.value)}
                      style={{
                        padding: "8px 14px 8px 36px",
                        fontSize: "13px",
                        borderRadius: "20px",
                        border: "1.5px solid var(--line, #E2E8F0)",
                        outline: "none",
                        width: "100%",
                        height: "38px",
                        background: "#FFFFFF",
                        color: "var(--navy, #0B2545)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
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
                      onClick={() => setCropCategoryFilter(cat)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 16,
                        fontSize: "12px",
                        fontWeight: 700,
                        border:
                          cropCategoryFilter === cat
                            ? "1.5px solid var(--green-deep)"
                            : "1px solid var(--line)",
                        background:
                          cropCategoryFilter === cat ? "rgba(23,107,69,0.08)" : "#FFFFFF",
                        color:
                          cropCategoryFilter === cat
                            ? "var(--green-deep)"
                            : "var(--ink-soft)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div
                  className="chip-grid mb-md"
                  style={{ maxHeight: 180, overflowY: "auto", padding: 2 }}
                >
                  {ALL_SUPPORTED_CROPS
                    .filter((c) => {
                      const matchesCat =
                        cropCategoryFilter === "All" || c.category === cropCategoryFilter;
                      const matchesSearch =
                        !cropSearchTerm ||
                        c.name.toLowerCase().includes(cropSearchTerm.toLowerCase());
                      return matchesCat && matchesSearch;
                    })
                    .map((c) => {
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
                          {isSelected && (
                            <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                          )}
                        </div>
                      );
                    })}

                  {/* Render Custom Added Crops */}
                  {selectedCrops
                    .filter(
                      (c) =>
                        !ALL_SUPPORTED_CROPS.some(
                          (pre) => pre.name.toLowerCase() === c.toLowerCase()
                        )
                    )
                    .map((customName) => (
                      <div
                        key={customName}
                        className="chip selected"
                        onClick={() => toggleCrop(customName)}
                        role="button"
                        tabIndex={0}
                        style={{ border: "1.5px solid var(--green-deep)" }}
                      >
                        <span style={{ marginRight: 4 }}>🌱</span>
                        {customName}
                        <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCustomCrop(customName, e)}
                          title="Remove custom crop"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "0 0 0 6px",
                            cursor: "pointer",
                            color: "var(--danger)",
                            fontSize: "13px",
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOtherCrop();
                        }
                      }}
                      placeholder="Enter crop name (e.g. Panasa, Soybean)"
                      style={{ maxWidth: 260 }}
                      autoFocus
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
                      onClick={() => {
                        setShowOtherCrop(false);
                        setOtherCropInput("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* CROP-WISE LAND ALLOCATION COMPACT SECTION */}
                {selectedCrops.length > 0 && (
                  <div
                    style={{
                      marginTop: 18,
                      background: "#FAFCF9",
                      border: isAllocationExceeded
                        ? "1.5px solid var(--danger)"
                        : "1.5px solid #D5E5D8",
                      borderRadius: 14,
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: "var(--green-deep)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          🌱 {t("onboarding.cropWiseLandAllocation", "CROP-WISE LAND ALLOCATION")}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--ink-soft)",
                            marginTop: 2,
                          }}
                        >
                          Specify how many {landUnit.toLowerCase()} are allocated to each cultivated crop.
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "12.5px",
                            fontWeight: 800,
                            color: isAllocationExceeded
                              ? "var(--danger)"
                              : isFullyAllocated
                              ? "var(--green-deep)"
                              : "var(--navy)",
                            background: isAllocationExceeded
                              ? "#FDE8E8"
                              : isFullyAllocated
                              ? "#E6F4EA"
                              : "#FFFFFF",
                            border: isAllocationExceeded
                              ? "1px solid #F8B4B4"
                              : "1px solid var(--line)",
                            padding: "4px 10px",
                            borderRadius: 8,
                          }}
                        >
                          {isFullyAllocated ? "✓ " : ""}
                          {t("onboarding.allocated", "Allocated")}: {allocatedLandNum} /{" "}
                          {totalLandNum || 0} {landUnit}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: isAllocationExceeded ? "var(--danger)" : "var(--ink-soft)",
                            marginTop: 3,
                          }}
                        >
                          {isAllocationExceeded ? (
                            <strong>
                              Exceeds by {(allocatedLandNum - totalLandNum).toFixed(1)} {landUnit}
                            </strong>
                          ) : (
                            <span>
                              {t("onboarding.remaining", "Remaining")}: {remainingLandNum.toFixed(1)}{" "}
                              {landUnit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Allocation Rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedCrops.map((cName) => {
                        const catalogItem = ALL_SUPPORTED_CROPS.find(
                          (ac) => ac.name.toLowerCase() === cName.toLowerCase()
                        );
                        const emoji = catalogItem?.emoji || "🌱";
                        const val =
                          cropAllocations[cName] !== undefined ? cropAllocations[cName] : "";

                        return (
                          <div
                            key={cName}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#FFFFFF",
                              border: "1px solid var(--line)",
                              borderRadius: 10,
                              padding: "8px 12px",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 120,
                              }}
                            >
                              <span style={{ fontSize: "18px" }}>{emoji}</span>
                              <span
                                style={{
                                  fontSize: "13.5px",
                                  fontWeight: 700,
                                  color: "var(--navy)",
                                }}
                              >
                                {cName}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ position: "relative", width: 110 }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max={totalLandNum || undefined}
                                  value={val}
                                  onChange={(e) => {
                                    const parsed =
                                      e.target.value === ""
                                        ? ""
                                        : Math.max(0, parseFloat(e.target.value));
                                    setCropAllocations((prev) => ({
                                      ...prev,
                                      [cName]: parsed,
                                    }));
                                  }}
                                  placeholder="0.0"
                                  style={{
                                    width: "100%",
                                    padding: "6px 10px",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    textAlign: "right",
                                    borderRadius: 8,
                                    border: isAllocationExceeded
                                      ? "1.5px solid var(--danger)"
                                      : "1px solid var(--line)",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--ink-soft)",
                                  minWidth: 55,
                                }}
                              >
                                {landUnit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Error Message */}
                    {isAllocationExceeded && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "8px 12px",
                          background: "#FDE8E8",
                          border: "1px solid #F8B4B4",
                          borderRadius: 8,
                          color: "var(--danger)",
                          fontSize: "12px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>⚠️</span>
                        <span>
                          Crop allocation exceeds your total cultivated land by{" "}
                          {(allocatedLandNum - totalLandNum).toFixed(1)} {landUnit}.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PRODUCTION / HARVEST */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 05 · PRODUCTION EXPECTATIONS</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Production / Harvest</h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
                  Estimated volume helps the AI calculate net realization per kg after freight and mandi costs.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
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
                    <option value="Near Maturity / Ready to Harvest">
                      Near Maturity / Ready to Harvest
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: SELLING PREFERENCES / MARKETS */}
            {step === 4 && (
              <div>
                <div className="onboard-num">STEP 04 OF 05 · SELLING PREFERENCES / MARKETS</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>
                  Selling Preferences / Markets
                </h2>
                <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "16px" }}>
                  Choose the channels you prefer to sell through and the mandis you want real-time price tracking for.
                </p>

                <label
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
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
                        {ch}{" "}
                        {isSelected && (
                          <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <label style={{ fontSize: 13.5, fontWeight: 700 }}>
                    Tracked Mandis & Nearby Markets:
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
                  <Search
                    size={16}
                    color="var(--ink-soft)"
                    style={{ position: "absolute", left: 10, top: 12 }}
                  />
                </div>

                <div
                  className="chip-grid"
                  style={{ maxHeight: 160, overflowY: "auto", padding: 2 }}
                >
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
                        {isSelected && (
                          <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & COMPLETE */}
            {step === 5 && (
              <div>
                <div className="onboard-num">STEP 05 OF 05 · REVIEW & COMPLETE</div>
                <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Review & Complete</h2>
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
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 13.5,
                    }}
                  >
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        FARM LOCATION
                      </strong>
                      <span>
                        {[farmerVillage, farmerDistrict, farmerState, "India"]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        TOTAL CULTIVATED LAND
                      </strong>
                      <span>
                        {landValue} {landUnit}
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        CULTIVATED CROPS & ACREAGE
                      </strong>
                      <div style={{ marginTop: 2 }}>
                        {selectedCrops.map((c) => {
                          const catalogItem = ALL_SUPPORTED_CROPS.find(
                            (ac) => ac.name.toLowerCase() === c.toLowerCase()
                          );
                          const emoji = catalogItem?.emoji || "🌱";
                          const area = cropAllocations[c];
                          const hasArea = typeof area === "number" && area > 0;
                          return (
                            <div key={c} style={{ fontSize: "13px", marginBottom: 2 }}>
                              {emoji} {c} — {hasArea ? `${area} ${landUnit}` : "Area not specified"}
                            </div>
                          );
                        })}
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "var(--green-deep)",
                            fontWeight: 700,
                            marginTop: 4,
                          }}
                        >
                          Total Allocated: {allocatedLandNum} {landUnit}{" "}
                          {remainingLandNum > 0
                            ? `(${remainingLandNum.toFixed(1)} ${landUnit} unallocated)`
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        PRODUCTION & SEASON
                      </strong>
                      <span>
                        {harvestQty} {harvestUnit} ({sowingSeason})
                      </span>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        SELLING CHANNELS & MANDIS
                      </strong>
                      <span>
                        Channels: {selectedChannels.join(", ")}
                        <br />
                        Tracked Mandis:{" "}
                        {selectedMarkets.length > 0 ? selectedMarkets.join(", ") : "All nearby mandis"}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--green-deep)",
                    fontSize: 13.5,
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>Ready to generate AI price discovery and decision recommendations.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* FPO ONBOARDING FLOW (4 STEPS)                                        */}
        {/* =================================================================== */}
        {role === "fpo" && (
          <>
            {/* STEP 1: ORGANIZATION PROFILE */}
            {step === 1 && (
              <div>
                <div className="onboard-num">STEP 01 OF 04 · ORGANIZATION</div>
                <h2>FPO Profile</h2>
                <p>
                  Provide organization credentials to configure your collective dashboard and institutional contracts.
                </p>

                <div className="field">
                  <label htmlFor="fpo-name">
                    Organization / FPO Name <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="fpo-name"
                    value={fpoOrgName}
                    onChange={(e) => setFpoOrgName(e.target.value)}
                    placeholder="e.g. Sahyadri Farmers Producer Company Ltd."
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="fpo-lead">Authorized Person / Representative</label>
                  <input
                    id="fpo-lead"
                    value={fpoAuthPerson}
                    onChange={(e) => setFpoAuthPerson(e.target.value)}
                    placeholder="e.g. Ramesh Patil (Managing Director)"
                  />
                </div>

                <div className="field">
                  <label htmlFor="fpo-reg-no">Registration Number / CIN</label>
                  <input
                    id="fpo-reg-no"
                    value={fpoRegNo}
                    onChange={(e) => setFpoRegNo(e.target.value)}
                    placeholder="e.g. U01100MH2022PTC123456"
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="fpo-org-type">Organization Type</label>
                    <select
                      id="fpo-org-type"
                      value={fpoOrgType}
                      onChange={(e) => setFpoOrgType(e.target.value)}
                    >
                      {FPO_ORG_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="fpo-year-est">Year Established</label>
                    <input
                      id="fpo-year-est"
                      type="number"
                      min="1950"
                      max="2026"
                      value={fpoYearEst}
                      onChange={(e) => setFpoYearEst(e.target.value)}
                      placeholder="e.g. 2021"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & MEMBERS */}
            {step === 2 && (
              <div>
                <div className="onboard-num">STEP 02 OF 04 · LOCATION & MEMBERS</div>
                <h2>FPO Location & Members</h2>
                <p>
                  Specify your cluster operating headquarters and producer membership network.
                </p>

                <div className="field">
                  <label htmlFor="fpo-state-select">
                    State / Union Territory <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="fpo-state-select"
                    value={fpoState}
                    onChange={(e) => setFpoState(e.target.value)}
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
                  <label htmlFor="fpo-district-select">
                    District <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  {fpoDistrictList.length > 0 ? (
                    <select
                      id="fpo-district-select"
                      value={fpoDistrict}
                      onChange={(e) => setFpoDistrict(e.target.value)}
                      required
                    >
                      {fpoDistrictList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="fpo-district-select"
                      value={fpoDistrict}
                      onChange={(e) => setFpoDistrict(e.target.value)}
                      placeholder="e.g. Nashik, Warangal, Sangli"
                      required
                    />
                  )}
                </div>

                <div className="field">
                  <label htmlFor="fpo-village-hq">Village / Town / Cluster HQ</label>
                  <input
                    id="fpo-village-hq"
                    value={fpoVillage}
                    onChange={(e) => setFpoVillage(e.target.value)}
                    placeholder="e.g. Pimpalgaon Baswant Agri Hub"
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="fpo-member-count">Number of Member Farmers</label>
                    <input
                      id="fpo-member-count"
                      type="number"
                      min="10"
                      value={fpoMemberCount}
                      onChange={(e) => setFpoMemberCount(parseInt(e.target.value) || 50)}
                      placeholder="e.g. 250"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="fpo-active-producers">Number of Active Producers</label>
                    <input
                      id="fpo-active-producers"
                      type="number"
                      min="5"
                      value={fpoActiveProducers}
                      onChange={(e) => setFpoActiveProducers(parseInt(e.target.value) || 20)}
                      placeholder="e.g. 180"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: AGGREGATION & STORAGE */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 04 · AGGREGATION & STORAGE</div>
                <h2>Aggregation & Storage</h2>
                <p>
                  Define the commodities pooled by your FPO, storage infrastructure, and grading capacities.
                </p>

                <label
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Main Aggregated Crops (Select Multiple):
                </label>
                <div className="chip-grid" style={{ marginBottom: 16 }}>
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
                        {isSelected && (
                          <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="fpo-annual-cap">Annual Aggregation Capacity (Tonnes)</label>
                    <input
                      id="fpo-annual-cap"
                      type="number"
                      min="10"
                      value={fpoAnnualCapacity}
                      onChange={(e) => setFpoAnnualCapacity(parseFloat(e.target.value) || 500)}
                      placeholder="e.g. 1500 MT"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="fpo-storage-cap">Available Storage Capacity (Tonnes)</label>
                    <input
                      id="fpo-storage-cap"
                      type="number"
                      min="0"
                      value={fpoStorageCapacity}
                      onChange={(e) => setFpoStorageCapacity(parseFloat(e.target.value) || 200)}
                      placeholder="e.g. 500 MT"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="fpo-storage-type">Storage Facility Type</label>
                    <select
                      id="fpo-storage-type"
                      value={fpoStorageType}
                      onChange={(e) => setFpoStorageType(e.target.value)}
                    >
                      {STORAGE_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="fpo-collection-centers">Number of Collection Centers</label>
                    <input
                      id="fpo-collection-centers"
                      type="number"
                      min="1"
                      value={fpoCollectionCenters}
                      onChange={(e) => setFpoCollectionCenters(parseInt(e.target.value) || 1)}
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="fpo-grading">Quality / Grading Capability</label>
                  <select
                    id="fpo-grading"
                    value={fpoGradingCapability}
                    onChange={(e) => setFpoGradingCapability(e.target.value)}
                  >
                    {GRADING_CAPABILITIES.map((gc) => (
                      <option key={gc} value={gc}>
                        {gc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: MARKET LINKAGES & SUMMARY */}
            {step === 4 && (
              <div>
                <div className="onboard-num">STEP 04 OF 04 · MARKET LINKAGES</div>
                <h2>Market Linkages & Setup</h2>
                <p>
                  Review your FPO aggregation setup before connecting with verified institutional buyers.
                </p>

                <div className="field">
                  <label htmlFor="fpo-buyers-served">Existing Buyer Relationships & Channels</label>
                  <input
                    id="fpo-buyers-served"
                    value={fpoBuyerRelations}
                    onChange={(e) => setFpoBuyerRelations(e.target.value)}
                    placeholder="e.g. ITC, BigBasket, Reliance Retail, Local APMC Traders"
                  />
                </div>

                <div className="field">
                  <label htmlFor="fpo-proc-regions">Preferred Procurement / Dispatch Regions</label>
                  <input
                    id="fpo-proc-regions"
                    value={fpoProcurementRegions}
                    onChange={(e) => setFpoProcurementRegions(e.target.value)}
                    placeholder="e.g. Maharashtra, Gujarat, Telangana, Karnataka"
                  />
                </div>

                <div
                  className="field"
                  style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 20px" }}
                >
                  <input
                    id="fpo-inst-contracts"
                    type="checkbox"
                    checked={fpoHasInstitutionalContracts}
                    onChange={(e) => setFpoHasInstitutionalContracts(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <label
                    htmlFor="fpo-inst-contracts"
                    style={{ margin: 0, fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}
                  >
                    FPO actively accepts institutional bulk procurement contracts and tenders
                  </label>
                </div>

                {/* Final FPO Summary */}
                <div
                  style={{
                    background: "var(--cream)",
                    border: "1px solid #EADBBE",
                    borderRadius: 10,
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 13.5,
                    }}
                  >
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        FPO PROFILE
                      </strong>
                      <span>
                        {fpoOrgName} ({fpoOrgType})
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          Reg: {fpoRegNo || "Registered FPO"} · Est. {fpoYearEst}
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        LOCATION & MEMBERS
                      </strong>
                      <span>
                        {[fpoVillage, fpoDistrict, fpoState].filter(Boolean).join(", ")}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--green-deep)", fontWeight: 700 }}>
                          {fpoMemberCount} Farmers ({fpoActiveProducers} Active)
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        MAIN CROPS & CAPACITY
                      </strong>
                      <span>
                        {fpoCrops.join(", ")}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          {fpoAnnualCapacity} Tonnes/yr Aggregation
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        STORAGE & INFRASTRUCTURE
                      </strong>
                      <span>
                        {fpoStorageCapacity} MT · {fpoStorageType}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          {fpoCollectionCenters} Centers · {fpoGradingCapability}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--green-deep)",
                    fontSize: 13.5,
                  }}
                >
                  <Building2 size={18} />
                  <span>Ready to pool bulk lots and negotiate high-volume institutional deals.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* BUYER ONBOARDING FLOW (4 STEPS)                                      */}
        {/* =================================================================== */}
        {role === "buyer" && (
          <>
            {/* STEP 1: PROCUREMENT ORGANIZATION */}
            {step === 1 && (
              <div>
                <div className="onboard-num">STEP 01 OF 04 · BUSINESS PROFILE</div>
                <h2>Procurement Organization</h2>
                <p>
                  Configure your business entity and procurement credentials to access verified farmer lots.
                </p>

                <div className="field">
                  <label htmlFor="buyer-org-name">
                    Organization / Company Name <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    id="buyer-org-name"
                    value={buyerOrgName}
                    onChange={(e) => setBuyerOrgName(e.target.value)}
                    placeholder="e.g. Agrilink Food Processors Pvt. Ltd."
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="buyer-contact">Primary Contact Person</label>
                  <input
                    id="buyer-contact"
                    value={buyerContactPerson}
                    onChange={(e) => setBuyerContactPerson(e.target.value)}
                    placeholder="e.g. Priya Sharma (Head of Sourcing)"
                  />
                </div>

                <div className="field">
                  <label htmlFor="buyer-cat">Business Type</label>
                  <select
                    id="buyer-cat"
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

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="buyer-gstin">GSTIN (Optional)</label>
                    <input
                      id="buyer-gstin"
                      value={buyerGst}
                      onChange={(e) => setBuyerGst(e.target.value)}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="buyer-fssai">FSSAI / Registration No. (Optional)</label>
                    <input
                      id="buyer-fssai"
                      value={buyerFssai}
                      onChange={(e) => setBuyerFssai(e.target.value)}
                      placeholder="e.g. 10020021000123"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROCUREMENT LOCATION */}
            {step === 2 && (
              <div>
                <div className="onboard-num">STEP 02 OF 04 · PROCUREMENT LOCATION</div>
                <h2>Procurement Location</h2>
                <p>
                  Configure your primary delivery hub and sourcing radius across Indian regions.
                </p>

                <div className="field">
                  <label htmlFor="buyer-state-select">
                    State / Union Territory <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select
                    id="buyer-state-select"
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
                  <label htmlFor="buyer-district-select">
                    District <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  {buyerDistrictList.length > 0 ? (
                    <select
                      id="buyer-district-select"
                      value={buyerDistrict}
                      onChange={(e) => setBuyerDistrict(e.target.value)}
                      required
                    >
                      {buyerDistrictList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="buyer-district-select"
                      value={buyerDistrict}
                      onChange={(e) => setBuyerDistrict(e.target.value)}
                      placeholder="e.g. Pune, Hyderabad, Bangalore, Delhi"
                      required
                    />
                  )}
                </div>

                <div className="field">
                  <label htmlFor="buyer-city">City / Town / Warehouse Hub</label>
                  <input
                    id="buyer-city"
                    value={buyerCity}
                    onChange={(e) => setBuyerCity(e.target.value)}
                    placeholder="e.g. Chakan Industrial Area / Kolar Hub"
                  />
                </div>

                <div className="field">
                  <label htmlFor="buyer-radius-slider">
                    Procurement Radius: <strong>{buyerProcRadius} km</strong>
                  </label>
                  <input
                    id="buyer-radius-slider"
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={buyerProcRadius}
                    onChange={(e) => setBuyerProcRadius(parseInt(e.target.value))}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11.5,
                      color: "var(--ink-soft)",
                    }}
                  >
                    <span>20 km (Local Cluster)</span>
                    <span>150 km (Regional Mandis)</span>
                    <span>500 km (Pan-State / Inter-state)</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WHAT DO YOU PROCURE? */}
            {step === 3 && (
              <div>
                <div className="onboard-num">STEP 03 OF 04 · PROCUREMENT NEEDS</div>
                <h2>What Do You Procure?</h2>
                <p>
                  Specify the crops, volume scale, and quality grading requirements for auto-matching.
                </p>

                <label
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Target Commodities (Select Multiple):
                </label>
                <div className="chip-grid" style={{ marginBottom: 16 }}>
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
                        {isSelected && (
                          <Check size={14} style={{ display: "inline", marginLeft: 4 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="buyer-min-qtl">Minimum Lot Size (Quintals)</label>
                    <input
                      id="buyer-min-qtl"
                      type="number"
                      min="1"
                      value={buyerMinQty}
                      onChange={(e) => setBuyerMinQty(parseFloat(e.target.value) || 1)}
                      placeholder="e.g. 25"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="buyer-max-qtl">Maximum Lot Size (Quintals)</label>
                    <input
                      id="buyer-max-qtl"
                      type="number"
                      min="1"
                      value={buyerMaxQty}
                      onChange={(e) => setBuyerMaxQty(parseFloat(e.target.value) || 500)}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="buyer-quality-grade">Preferred Quality Grade</label>
                    <select
                      id="buyer-quality-grade"
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
                    <label htmlFor="buyer-ind-price">Indicative Benchmark Price (₹/kg)</label>
                    <input
                      id="buyer-ind-price"
                      type="number"
                      step="0.5"
                      value={buyerIndicativePrice}
                      onChange={(e) => setBuyerIndicativePrice(e.target.value)}
                      placeholder="e.g. 32"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="buyer-quality-specs">Quality Requirements & Specs</label>
                  <input
                    id="buyer-quality-specs"
                    value={buyerQualityRequirements}
                    onChange={(e) => setBuyerQualityRequirements(e.target.value)}
                    placeholder="e.g. Moisture < 12%, Organic Certified, Zero Foreign Matter"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: PROCUREMENT & SETTLEMENT */}
            {step === 4 && (
              <div>
                <div className="onboard-num">STEP 04 OF 04 · PROCUREMENT & SETTLEMENT</div>
                <h2>Procurement & Settlement</h2>
                <p>
                  Set your financial settlement terms, payment methods, and review your procurement profile.
                </p>

                <div
                  style={{
                    background: "#FEF3C7",
                    border: "1px solid #FCD34D",
                    borderRadius: 10,
                    padding: "14px",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <ShieldCheck size={20} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.5 }}>
                    <strong>Verification Status: PENDING COMPLIANCE REVIEW</strong>
                    <p style={{ margin: "4px 0 0" }}>
                      You have full access to explore available lots and place purchase bids. The verified institutional badge will activate once business documentation is approved.
                    </p>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="buyer-pay-terms">Payment Terms</label>
                    <select
                      id="buyer-pay-terms"
                      value={buyerPaymentTerms}
                      onChange={(e) => setBuyerPaymentTerms(e.target.value)}
                    >
                      {PAYMENT_TERMS_LIST.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="buyer-settle-method">Preferred Settlement Method</label>
                    <select
                      id="buyer-settle-method"
                      value={buyerSettlementMethod}
                      onChange={(e) => setBuyerSettlementMethod(e.target.value)}
                    >
                      {SETTLEMENT_METHODS.map((sm) => (
                        <option key={sm} value={sm}>
                          {sm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="buyer-freq">Procurement Frequency</label>
                  <select
                    id="buyer-freq"
                    value={buyerProcFrequency}
                    onChange={(e) => setBuyerProcFrequency(e.target.value)}
                  >
                    {PROCUREMENT_FREQUENCIES.map((pf) => (
                      <option key={pf} value={pf}>
                        {pf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Final Buyer Summary */}
                <div
                  style={{
                    background: "var(--cream)",
                    border: "1px solid #EADBBE",
                    borderRadius: 10,
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 13.5,
                    }}
                  >
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        ORGANIZATION
                      </strong>
                      <span>
                        {buyerOrgName} ({buyerBusinessType})
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          Contact: {buyerContactPerson}
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        LOCATION & RADIUS
                      </strong>
                      <span>
                        {[buyerCity, buyerDistrict, buyerState].filter(Boolean).join(", ")}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--green-deep)", fontWeight: 700 }}>
                          Radius: {buyerProcRadius} km
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        TARGET CROPS & QUANTITY
                      </strong>
                      <span>
                        {buyerCrops.join(", ")}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          Volume: {buyerMinQty} - {buyerMaxQty} Quintals
                        </span>
                      </span>
                    </div>
                    <div>
                      <strong
                        style={{ color: "var(--ink-soft)", display: "block", fontSize: 12 }}
                      >
                        SETTLEMENT & QUALITY
                      </strong>
                      <span>
                        {buyerPaymentTerms}
                        <br />
                        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                          {buyerQuality} · {buyerSettlementMethod}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--green-deep)",
                    fontSize: 13.5,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Procurement portal configured. Ready to match with harvest lots.</span>
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
              <ArrowLeft size={16} /> {t("onboarding.back", "Back")}
            </button>
          ) : (
            <div />
          )}

          <button
            className="btn btn-primary"
            type="button"
            onClick={handleNext}
            disabled={role === "farmer" && step === 2 && isAllocationExceeded}
            style={
              role === "farmer" && step === 2 && isAllocationExceeded
                ? { opacity: 0.5, cursor: "not-allowed" }
                : undefined
            }
          >
            {step < totalSteps ? (
              <>
                {t("onboarding.continue", "Continue")} <ArrowRight size={16} />
              </>
            ) : role === "farmer" ? (
              t("onboarding.completeFarmerSetup", "Complete Farmer Setup")
            ) : role === "fpo" ? (
              t("onboarding.completeFpoSetup", "Complete FPO Setup")
            ) : (
              t("onboarding.completeBuyerSetup", "Complete Buyer Setup")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
