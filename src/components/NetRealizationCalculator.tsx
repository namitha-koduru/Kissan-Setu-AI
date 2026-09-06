import { useState } from "react";
import { Calculator } from "lucide-react";
import { netRealization } from "../engine/recommendation";

export function NetRealizationCalculator({
  quantityKg: initialQty = 500,
  sellingPrice: initialPrice = 30,
  transportCost: initialTransport = 400,
  storageCost: initialStorage = 0,
  estimatedLoss: initialLoss = 120,
}: {
  quantityKg?: number;
  sellingPrice?: number;
  transportCost?: number;
  storageCost?: number;
  estimatedLoss?: number;
}) {
  const [quantityKg, setQuantityKg] = useState(initialQty);
  const [sellingPrice, setSellingPrice] = useState(initialPrice);
  const [transportCost, setTransportCost] = useState(initialTransport);
  const [storageCost, setStorageCost] = useState(initialStorage);
  const [estimatedLoss, setEstimatedLoss] = useState(initialLoss);

  const res = netRealization({
    quantityKg,
    sellingPrice,
    transportCost,
    storageCost,
    estimatedLoss,
  });

  return (
    <div className="card card-pad" style={{ background: "#FAFAF8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Calculator size={18} color="#176B45" />
        <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Net Realization Calculator</h3>
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Produce Quantity (kg)</label>
          <input
            type="number"
            value={quantityKg}
            onChange={(e) => setQuantityKg(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label>Mandi Selling Price (₹/kg)</label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label>Logistics & Transport Cost (₹ total)</label>
          <input
            type="number"
            value={transportCost}
            onChange={(e) => setTransportCost(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label>Storage / Holding Cost (₹ total)</label>
          <input
            type="number"
            value={storageCost}
            onChange={(e) => setStorageCost(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="field">
          <label>Handling & Spoilage Loss (₹ estimated)</label>
          <input
            type="number"
            value={estimatedLoss}
            onChange={(e) => setEstimatedLoss(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>

      <div
        style={{
          background: "var(--cream)",
          border: "1px solid #EADBBE",
          borderRadius: "12px",
          padding: "16px 20px",
          marginTop: "14px",
        }}
      >
        <div className="pf-row">
          <span className="l">Gross Market Revenue</span>
          <span className="v">₹{res.gross.toLocaleString("en-IN")}</span>
        </div>
        <div className="pf-row">
          <span className="l">Total Deductions (Transport + Storage + Loss)</span>
          <span className="v" style={{ color: "var(--danger)" }}>
            - ₹{(transportCost + storageCost + estimatedLoss).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="pf-row" style={{ borderTop: "2px solid #EADBBE", marginTop: 6, paddingTop: 10 }}>
          <span className="l" style={{ fontWeight: 800, fontSize: "15px", color: "var(--ink)" }}>
            Net In-Hand Farmer Realization
          </span>
          <span className="v" style={{ fontSize: "20px", fontWeight: 800, color: "var(--green-deep)" }}>
            ₹{res.net.toLocaleString("en-IN")} (₹{res.perKg.toFixed(2)}/kg)
          </span>
        </div>
      </div>
    </div>
  );
}
