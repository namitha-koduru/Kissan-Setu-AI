import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Package, ShieldCheck } from "lucide-react";
import { buyers } from "../data/demo";

export function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const buyer = buyers.find((b) => b.id === id) || buyers[0];

  return (
    <div className="wrap" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 12, paddingTop: 10 }}>
        <Link to="/buyers" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Buyer Marketplace
        </Link>
      </div>

      <div className="page-header" style={{ paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800 }}>{buyer.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MapPin size={14} color="#176B45" />
              <span style={{ fontSize: "13.5px", color: "var(--ink-soft)" }}>
                {buyer.location} ({buyer.distanceKm} km from your farm)
              </span>
            </div>
          </div>

          {buyer.verified ? (
            <span className="verified-tag" style={{ fontSize: "13px", padding: "4px 10px", background: "rgba(23,107,69,0.1)", borderRadius: 12 }}>
              <CheckCircle2 size={15} color="#176B45" /> Verified Enterprise Procurer
            </span>
          ) : (
            <span style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>Verification Pending</span>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          Buyer Procurement Tender & Requirements
        </h3>

        <div className="pf-row">
          <span className="l">Target Crop Required</span>
          <span className="v" style={{ fontWeight: 800 }}>{buyer.crop}</span>
        </div>
        <div className="pf-row">
          <span className="l">Total Required Volume</span>
          <span className="v">{buyer.quantityKg.toLocaleString("en-IN")} kg</span>
        </div>
        <div className="pf-row">
          <span className="l">Mandatory Quality Grade</span>
          <span className="v">{buyer.quality}</span>
        </div>
        <div className="pf-row">
          <span className="l">Offered Direct Purchase Price</span>
          <span className="v" style={{ color: "var(--green-deep)", fontSize: "18px", fontWeight: 800 }}>
            ₹{buyer.offeredPrice}/kg
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Payment & Settlement Terms</span>
          <span className="v">{buyer.paymentRating || "Instant T+1 Settlement via Bank/UPI"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Tender Expiry / Acceptance Deadline</span>
          <span className="v" style={{ color: "var(--terracotta)" }}>
            {buyer.deadlineDate || `${buyer.deadlineDays} days remaining`}
          </span>
        </div>
        <div className="pf-row">
          <span className="l">Logistics & Pickup</span>
          <span className="v">Farm-gate pickup or Mandi Delivery supported</span>
        </div>

        <button
          className="btn btn-primary btn-block"
          type="button"
          onClick={() => navigate(`/lots/create?buyer=${buyer.id}`)}
          style={{ marginTop: 22, padding: "12px 20px" }}
        >
          <Package size={16} /> Create Selling Lot for {buyer.name}
        </button>
      </div>

      <div className="card card-pad" style={{ marginTop: 16, background: "var(--cream)", border: "1px solid #EADBBE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={20} color="#176B45" />
          <h4 style={{ fontSize: "14.5px", fontWeight: 800 }}>Verified Buyer Guarantee</h4>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6 }}>
          All verified buyers on KisanSetu are pre-audited with valid GST/FSSAI credentials and committed to direct digital payment settlement upon digital lot inspection.
        </p>
      </div>
    </div>
  );
}
