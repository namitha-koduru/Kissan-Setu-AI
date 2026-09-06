import { CheckCircle2 } from "lucide-react";
import type { OfferRecord } from "../types";

export function OfferCard({
  offer,
  onAccept,
  onReject,
  onCounter,
}: {
  offer: OfferRecord;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
}) {
  return (
    <div className="offer-card">
      <div className="buyer-top">
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{offer.buyerName}</h3>
          {offer.verified ? (
            <span className="verified-tag">
              <CheckCircle2 size={13} color="#176B45" /> Verified Buyer
            </span>
          ) : (
            <span style={{ fontSize: "11.5px", color: "var(--ink-soft)" }}>Unverified Buyer</span>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="badge-pill badge-high" style={{ fontSize: "15px", fontWeight: 800 }}>
            ₹{offer.pricePerKg}/kg
          </span>
          <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: 2 }}>
            Total Value: ₹{(offer.pricePerKg * offer.quantityKg).toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="buyer-facts">
        <div>
          <div className="l">Lot ID</div>
          <div className="v">{offer.lotId}</div>
        </div>
        <div>
          <div className="l">Quantity Accepted</div>
          <div className="v">{offer.quantityKg.toLocaleString("en-IN")} kg</div>
        </div>
        <div>
          <div className="l">Quality Requirement</div>
          <div className="v">{offer.quality}</div>
        </div>
        <div>
          <div className="l">Offer Expiry</div>
          <div className="v" style={{ color: "var(--terracotta)" }}>
            {offer.expiresInDays}
          </div>
        </div>
        <div>
          <div className="l">Status</div>
          <div className="v">
            <span
              className={`badge-pill ${
                offer.status === "Accepted"
                  ? "badge-high"
                  : offer.status === "Pending"
                  ? "badge-medium"
                  : "badge-low"
              }`}
            >
              {offer.status}
            </span>
          </div>
        </div>
      </div>

      {offer.status === "Pending" && (
        <div className="buyer-foot">
          <button className="btn btn-danger-outline btn-sm" type="button" onClick={onReject}>
            Reject Offer
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={onCounter}>
              Counter Offer
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={onAccept}>
              Accept Offer
            </button>
          </div>
        </div>
      )}

      {offer.status === "Accepted" && (
        <div className="buyer-foot" style={{ color: "var(--green-deep)", fontWeight: 700, fontSize: "13.5px" }}>
          ✓ Offer accepted. Ready for pickup and transaction settlement.
        </div>
      )}
    </div>
  );
}
