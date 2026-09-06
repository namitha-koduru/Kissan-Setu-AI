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
    <article className="offer-card">
      <div className="row space">
        <h3 style={{ margin: 0 }}>{offer.buyerName}</h3>
        <span className={`badge ${offer.status === "Accepted" ? "badge-green" : offer.status === "Rejected" ? "badge-gray" : "badge-orange"}`}>
          {offer.status}
        </span>
      </div>
      <p>
        ₹{offer.pricePerKg}/kg · {offer.quantityKg.toLocaleString("en-IN")} kg · {offer.quality}
      </p>
      <p className="small">Lot {offer.lotId} · Expires in {offer.expiresInDays} days</p>
      {offer.status === "Pending" && (
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btn-primary" type="button" onClick={onAccept}>
            Accept
          </button>
          <button className="btn btn-danger" type="button" onClick={onReject}>
            Reject
          </button>
          <button className="btn btn-secondary" type="button" onClick={onCounter}>
            Counter offer
          </button>
        </div>
      )}
    </article>
  );
}
