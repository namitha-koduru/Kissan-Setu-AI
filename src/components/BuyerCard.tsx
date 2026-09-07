import { CheckCircle2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BuyerListing } from "../types";
import { useLanguage } from "../context/LanguageContext";

export function BuyerCard({ buyer }: { buyer: BuyerListing }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="buyer-card">
      <div className="buyer-top">
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{buyer.name}</h3>
          {buyer.verified ? (
            <span className="verified-tag">
              <CheckCircle2 size={13} color="#176B45" /> Verified Enterprise Buyer
            </span>
          ) : (
            <span style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>New Buyer · Verification Pending</span>
          )}
        </div>
        <span className="badge-pill badge-high" style={{ fontSize: "13px", padding: "4px 10px" }}>
          ₹{buyer.offeredPrice}/kg
        </span>
      </div>

      <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", margin: "4px 0 8px" }}>
        {buyer.crop} · <strong>{buyer.quantityKg.toLocaleString("en-IN")} kg required</strong> · Quality: {buyer.quality}
      </p>

      <div className="buyer-facts">
        <div>
          <div className="l">Location / Distance</div>
          <div className="v" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={13} color="#176B45" /> {buyer.location} ({buyer.distanceKm} km)
          </div>
        </div>
        <div>
          <div className="l">Offer Valid For</div>
          <div className="v" style={{ color: "var(--terracotta)" }}>{buyer.deadlineDays} days</div>
        </div>
      </div>

      <div className="buyer-foot">
        <span style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>
          {buyer.paymentRating || "Reliable Payer"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => navigate(`/lots/create?buyer=${buyer.id}`)}
          >
            {t("buyers.connect")}
          </button>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => navigate(`/buyers/${buyer.id}`)}
          >
            {t("buyers.viewDetail")}
          </button>
        </div>
      </div>
    </div>
  );
}
