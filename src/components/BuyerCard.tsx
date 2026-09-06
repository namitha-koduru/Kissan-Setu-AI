import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import type { BuyerListing } from "../types";

export function BuyerCard({ buyer }: { buyer: BuyerListing }) {
  return (
    <article className={`buyer-card ${buyer.verified ? "verified" : ""}`}>
      <div className="row space">
        <h3 style={{ margin: 0 }}>{buyer.name}</h3>
        {buyer.verified && (
          <span className="badge badge-green">
            <BadgeCheck size={14} /> Verified buyer
          </span>
        )}
      </div>
      <p className="small">
        Needs {buyer.crop} · {buyer.quantityKg.toLocaleString("en-IN")} kg · {buyer.quality}
      </p>
      <p>
        Offered price <strong>₹{buyer.offeredPrice}/kg</strong>
      </p>
      <p className="small">
        {buyer.distanceKm} km · Offer valid for {buyer.deadlineDays} days · {buyer.location}
      </p>
      <Link className="btn btn-primary" to={`/buyers?id=${buyer.id}`} style={{ marginTop: 10 }}>
        View details
      </Link>
    </article>
  );
}
