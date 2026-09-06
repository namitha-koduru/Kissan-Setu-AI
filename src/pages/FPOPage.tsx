import { Link } from "react-router-dom";
import { Plus, ShieldCheck } from "lucide-react";
import { fpoFarmers } from "../data/demo";
import { MetricCard } from "../components/MetricCard";

export function FPOPage() {
  const totalVolume = fpoFarmers.reduce((sum, f) => sum + f.quantityKg, 0);
  const expectedValue = totalVolume * 29;

  return (
    <div className="wrap">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 0 14px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Godavari Farmers Producer Company</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            FPO Collective Bargaining & Aggregation Dashboard · Nashik Cluster
          </p>
        </div>

        <Link className="btn btn-primary" to="/lots/create">
          <Plus size={16} /> Create Aggregated Lot
        </Link>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="metric-grid" style={{ marginTop: 6, marginBottom: 20 }}>
        <MetricCard label="Contributing Smallholders" value={`${fpoFarmers.length} Farmers`} hint="Tomato Pool" />
        <MetricCard label="Pooled Produce Volume" value={`${totalVolume.toLocaleString("en-IN")} kg`} hint="Bulk Grade A" />
        <MetricCard label="Collective Freight Savings" value="₹3,200" hint="Shared Trucking" />
        <MetricCard label="Active Institutional Tenders" value="3 Buyers" hint="Reliance, Sahyadri, BigBasket" />
        <MetricCard label="Expected Pool Value" value={`₹${expectedValue.toLocaleString("en-IN")}`} hint="@ ₹29/kg Net" />
      </div>

      {/* Contributing Farmers Table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Contributing Farmers — Tomato Pool</h3>
          <span className="demo-tag">LIVE POOL DATA</span>
        </div>

        <div className="card card-pad table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer Name & Location</th>
                <th>Crop</th>
                <th>Quality Grade</th>
                <th>Contributed Volume</th>
                <th>Expected Payout</th>
              </tr>
            </thead>
            <tbody>
              {fpoFarmers.map((f) => (
                <tr key={f.name}>
                  <td data-label="Farmer Name">
                    <strong>{f.name}</strong>
                  </td>
                  <td data-label="Crop">{f.crop}</td>
                  <td data-label="Quality Grade">
                    <span className="badge-pill badge-high">{f.grade}</span>
                  </td>
                  <td data-label="Contributed Volume" style={{ fontWeight: 700 }}>
                    {f.quantityKg} kg
                  </td>
                  <td data-label="Expected Payout" style={{ fontWeight: 700, color: "var(--green-deep)" }}>
                    ₹{(f.quantityKg * 29).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              <tr className="highlight" style={{ borderTop: "2px solid var(--line-strong)" }}>
                <td data-label="Farmer Name" style={{ fontWeight: 800, fontSize: "15px" }}>
                  Total Aggregated Pool
                </td>
                <td data-label="Crop">Tomato</td>
                <td data-label="Quality Grade">Mixed Grade A/B+</td>
                <td data-label="Contributed Volume" style={{ fontWeight: 800, fontSize: "16px", color: "var(--green-deep)" }}>
                  {totalVolume.toLocaleString("en-IN")} kg
                </td>
                <td data-label="Expected Payout" style={{ fontWeight: 800, fontSize: "16px", color: "var(--green-deep)" }}>
                  ₹{expectedValue.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FPO Advantages Banner */}
      <div className="card card-pad" style={{ background: "var(--cream)", border: "1px solid #EADBBE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} color="#176B45" />
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>FPO Collective Bargaining Power</h4>
        </div>
        <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", marginTop: 6 }}>
          By pooling smaller farm lots (300kg–700kg) into a consolidated 1,950 kg lot, the FPO eliminates individual transport overheads, unlocks wholesale bulk buyers like BigBasket, and secures higher net prices for every member farmer.
        </p>
      </div>
    </div>
  );
}
