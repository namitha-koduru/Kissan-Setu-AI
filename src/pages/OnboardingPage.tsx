import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAppState } from "../context/AppStateContext";
import { cropOptions, locationOptions } from "../data/demo";

export function OnboardingPage() {
  const { onboardData, updateOnboardData, showToast } = useAppState();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [village, setVillage] = useState(onboardData.village || "Niphad");
  const [district, setDistrict] = useState(onboardData.district || "Nashik");
  const [selectedCrops, setSelectedCrops] = useState<string[]>(onboardData.crops || ["Tomato", "Onion"]);
  const [quantity, setQuantity] = useState(onboardData.quantity || "500 kg");
  const [land, setLand] = useState(onboardData.land || "2.5 acres");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(onboardData.markets || ["Nashik", "Ahmednagar", "Pune"]);

  const toggleCrop = (c: string) => {
    if (selectedCrops.includes(c)) {
      setSelectedCrops(selectedCrops.filter((x) => x !== c));
    } else {
      setSelectedCrops([...selectedCrops, c]);
    }
  };

  const toggleMarket = (m: string) => {
    if (selectedMarkets.includes(m)) {
      setSelectedMarkets(selectedMarkets.filter((x) => x !== m));
    } else {
      setSelectedMarkets([...selectedMarkets, m]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      updateOnboardData({ village, district });
      setStep(2);
    } else if (step === 2) {
      updateOnboardData({ crops: selectedCrops.length ? selectedCrops : ["Tomato"] });
      setStep(3);
    } else if (step === 3) {
      updateOnboardData({ quantity, land });
      setStep(4);
    } else {
      updateOnboardData({ markets: selectedMarkets.length ? selectedMarkets : ["Nashik"] });
      showToast("Account & farm profile created successfully! Welcome to KisanSetu AI.");
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="onboard-shell">
      <div style={{ width: "100%", maxWidth: 540, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <Logo to="/" />
        <Link to="/login" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
          Already registered? Log in
        </Link>
      </div>

      <div className="progress-row">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`progress-step ${n <= step ? "done" : ""}`} />
        ))}
      </div>

      <div className="onboard-card card card-pad">
        {step === 1 && (
          <div>
            <div className="onboard-num">STEP 01 OF 04</div>
            <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Farm Location</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "22px" }}>
              Helps us match you to local meteorological weather forecasts and nearby mandis.
            </p>
            <div className="field">
              <label>Village / Town</label>
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Niphad / Pimpalgaon"
                required
              />
            </div>
            <div className="field">
              <label>District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Nashik"
                required
              />
            </div>
            <div className="field">
              <label>State</label>
              <input value="Maharashtra" disabled style={{ background: "#f8f9f7", color: "#666" }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="onboard-num">STEP 02 OF 04</div>
            <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Your Primary Crops</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "14px" }}>
              Select all crops you cultivate to receive specialized stage and price alerts.
            </p>
            <div className="chip-grid">
              {cropOptions.map((c) => {
                const isSelected = selectedCrops.includes(c);
                return (
                  <div
                    key={c}
                    className={`chip ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleCrop(c)}
                  >
                    {c === "Tomato" ? "🍅 " : c === "Onion" ? "🧅 " : c === "Potato" ? "🥔 " : "🌶️ "}
                    {c} {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="onboard-num">STEP 03 OF 04</div>
            <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Harvest Volume & Land Size</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "22px" }}>
              Enables accurate freight optimization and bulk lot matching.
            </p>
            <div className="field">
              <label>Typical Quantity Harvested per Season</label>
              <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500 kg / 20 quintals"
              />
            </div>
            <div className="field">
              <label>Land Under Cultivation</label>
              <input
                value={land}
                onChange={(e) => setLand(e.target.value)}
                placeholder="e.g. 2.5 acres"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="onboard-num">STEP 04 OF 04</div>
            <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Preferred Mandis & Markets</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "14px" }}>
              Which markets would you like KisanSetu AI to track and compare net realizations for?
            </p>
            <div className="chip-grid">
              {locationOptions.map((m) => {
                const isSelected = selectedMarkets.includes(m);
                return (
                  <div
                    key={m}
                    className={`chip ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleMarket(m)}
                  >
                    {m} Mandi {isSelected && <Check size={14} style={{ display: "inline", marginLeft: 4 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
          {step > 1 ? (
            <button className="btn btn-ghost" type="button" onClick={handleBack}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          <button className="btn btn-primary" type="button" onClick={handleNext}>
            {step < 4 ? (
              <>
                Continue <ArrowRight size={16} />
              </>
            ) : (
              "Complete Setup & View Dashboard"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
