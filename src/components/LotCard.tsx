import { useNavigate } from "react-router-dom";
import type { LotRecord } from "../types";
import { useLanguage } from "../context/LanguageContext";

export function LotCard({ lot }: { lot: LotRecord }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    if (status === "Open for Offers") return "badge-high";
    if (status === "Offer Accepted" || status === "Sold") return "badge-medium";
    return "badge-low";
  };

  return (
    <div className="lot-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
            {lot.crop} · {lot.quantityKg.toLocaleString("en-IN")} kg
          </h3>
          <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", marginTop: 3 }}>
            Lot ID: <strong>{lot.id}</strong> · Location: {lot.location} · Quality: {lot.quality}
          </p>
        </div>
        <span className={`badge-pill ${getStatusBadge(lot.status)}`}>{lot.status}</span>
      </div>

      <div className="buyer-facts">
        <div>
          <div className="l">Expected Target Price</div>
          <div className="v">₹{lot.expectedPrice}/kg</div>
        </div>
        <div>
          <div className="l">Buyer Interests / Bids</div>
          <div className="v">{lot.interests || 2} active inquiries</div>
        </div>
        <div>
          <div className="l">Harvest / Availability Date</div>
          <div className="v">{lot.harvestDate}</div>
        </div>
      </div>

      <div className="buyer-foot">
        <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
          {lot.aggregated ? `Aggregated pool from ${lot.farmerCount || 3} farmers` : "Individual farmer lot"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => navigate(`/offers?lot=${lot.id}`)}
          >
            {t("nav.offers")} ({lot.interests || 2})
          </button>
        </div>
      </div>
    </div>
  );
}
