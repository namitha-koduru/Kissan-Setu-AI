import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Store, TrendingUp, Sparkles } from "lucide-react";
import { DecisionBadge } from "../components/DecisionBadge";
import { HarvestTimeline } from "../components/HarvestTimeline";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function CropDetailsPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { crops, setActiveCropId } = useAppState();
  const navigate = useNavigate();

  const crop = crops.find((c) => c.id === id) || crops[0];

  if (!crop) {
    return (
      <div className="wrap" style={{ paddingTop: 30 }}>
        <p>Crop not found.</p>
        <Link className="btn btn-primary" to="/crops" style={{ marginTop: 10 }}>
          Back to Crops
        </Link>
      </div>
    );
  }

  const handleOpenDecision = () => {
    setActiveCropId(crop.id);
    navigate("/recommendation");
  };

  return (
    <div className="wrap">
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link to="/crops" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t("nav.myCrops")}
        </Link>
      </div>

      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 14,
          paddingBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>
            {crop.icon || "🌱"} {crop.name}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            {crop.acreage ? `${crop.acreage} ${crop.acreageUnit || "Acres"} · ` : ""}{crop.quantityKg} {crop.unit || "kg"} · {t("crops.variety")}: {crop.variety || "Hybrid"} · {t("auth.location")}: {crop.location}
          </p>
        </div>

        <button className="btn btn-primary" type="button" onClick={handleOpenDecision}>
          <Sparkles size={16} /> {t("recommendations.title")} <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.3fr 0.7fr", marginTop: 8 }}>
        <div>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
              <div className="reco-stat">
                <div className="label">Current Growth Stage</div>
                <div className="val">{crop.stage}</div>
              </div>
              <div className="reco-stat">
                <div className="label">Estimated Harvest Window</div>
                <div className="val" style={{ color: "var(--green-deep)", fontWeight: 800 }}>
                  {crop.harvestWindow || "2–4 days"}
                </div>
              </div>
              <div className="reco-stat">
                <div className="label">Expected Harvest Date</div>
                <div className="val">{crop.harvestEst || "08–10 Sep 2026"}</div>
              </div>
            </div>

            <HarvestTimeline
              windowLabel={crop.harvestWindow || "2–4 days"}
              stage={crop.stage}
              risk="Medium"
              action={crop.recommendation === "SELL" ? "SELL NOW" : crop.recommendation || "WAIT"}
            />
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
              Registered Crop Specifications
            </h3>
            <div className="pf-row">
              <span className="l">Crop Variety / Hybrid</span>
              <span className="v">{crop.variety || "Hybrid F1"}</span>
            </div>
            <div className="pf-row">
              <span className="l">Allocated Cultivated Land</span>
              <span className="v">{crop.acreage ? `${crop.acreage} ${crop.acreageUnit || "Acres"}` : "Area not specified"}</span>
            </div>
            <div className="pf-row">
              <span className="l">Total Registered Volume</span>
              <span className="v">{crop.quantityKg.toLocaleString("en-IN")} {crop.unit || "kg"}</span>
            </div>
            <div className="pf-row">
              <span className="l">Farm Parcel Location</span>
              <span className="v">{crop.location}</span>
            </div>
            <div className="pf-row">
              <span className="l">Recorded Sowing Date</span>
              <span className="v">{crop.sowingDate}</span>
            </div>
            <div className="pf-row">
              <span className="l">Target Expected Price</span>
              <span className="v">₹{crop.expectedPrice || 29}/kg</span>
            </div>
          </div>
        </div>

        <div>
          <div className="card card-pad">
            <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: 10 }}>
              AI Decision Status
            </h3>
            <DecisionBadge decision={crop.recommendation || "SELL"} size="md" />

            <div style={{ marginTop: 16 }} className="reco-stat">
              <div className="label">Recommended Destination Mandi</div>
              <div className="val" style={{ fontWeight: 800 }}>{crop.bestMarket || `${crop.location ? crop.location.split(",")[0] : "Local"} APMC Mandi`}</div>
            </div>

            <div style={{ marginTop: 12 }} className="reco-stat">
              <div className="label">Expected Net Realization</div>
              <div className="val" style={{ color: "var(--green-deep)", fontSize: "20px", fontWeight: 800 }}>
                ₹{crop.netRealization || 29}/kg
              </div>
            </div>

            <div style={{ marginTop: 12 }} className="reco-stat">
              <div className="label">Decision Confidence</div>
              <div className="val">{crop.confidence || 86}% (High)</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary btn-block" type="button" onClick={handleOpenDecision}>
                AI Decision Center
              </button>
              <Link
                className="btn btn-outline btn-block"
                to={`/chat?crop_id=${crop.id}&crop_name=${encodeURIComponent(crop.name)}`}
                style={{
                  borderColor: "var(--green-deep)",
                  color: "var(--green-deep)",
                  background: "var(--green-light)",
                  fontWeight: 700,
                }}
              >
                📷 Analyze Leaf / Crop Photo
              </Link>
              <Link className="btn btn-outline btn-block" to="/market">
                <Store size={15} /> Compare Nearby Mandis
              </Link>
              <Link className="btn btn-outline btn-block" to={`/lots/create`}>
                <TrendingUp size={15} /> Open Lot for Buyer Offers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
