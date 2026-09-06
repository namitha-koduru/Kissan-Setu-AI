import { useMemo, useState } from "react";
import { netRealization } from "../engine/recommendation";

export function NetRealizationCalculator({
  quantityKg = 500,
  sellingPrice = 30,
  transportCost = 400,
  storageCost = 0,
  estimatedLoss = 100,
}: {
  quantityKg?: number;
  sellingPrice?: number;
  transportCost?: number;
  storageCost?: number;
  estimatedLoss?: number;
}) {
  const [qty, setQty] = useState(quantityKg);
  const [price, setPrice] = useState(sellingPrice);
  const [transport, setTransport] = useState(transportCost);
  const [storage, setStorage] = useState(storageCost);
  const [loss, setLoss] = useState(estimatedLoss);

  const out = useMemo(
    () =>
      netRealization({
        quantityKg: qty,
        sellingPrice: price,
        transportCost: transport,
        storageCost: storage,
        estimatedLoss: loss,
      }),
    [qty, price, transport, storage, loss],
  );

  return (
    <div className="calc card">
      <div>
        <div className="section-label">Net realization calculator</div>
        <p className="small">See why the highest market price is not always the best option.</p>
        <div className="field">
          <label htmlFor="qty">Quantity (kg)</label>
          <input id="qty" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="price">Selling price (₹/kg)</label>
          <input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="tr">Transport cost (₹)</label>
          <input id="tr" type="number" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="st">Storage cost (₹)</label>
          <input id="st" type="number" value={storage} onChange={(e) => setStorage(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="ls">Estimated handling / loss (₹)</label>
          <input id="ls" type="number" value={loss} onChange={(e) => setLoss(Number(e.target.value))} />
        </div>
      </div>
      <div className="calc-out">
        <div className="calc-line">
          <span>Gross selling value</span>
          <strong>₹{out.gross.toLocaleString("en-IN")}</strong>
        </div>
        <div className="calc-line">
          <span>Transport</span>
          <span>− ₹{transport.toLocaleString("en-IN")}</span>
        </div>
        <div className="calc-line">
          <span>Storage</span>
          <span>− ₹{storage.toLocaleString("en-IN")}</span>
        </div>
        <div className="calc-line">
          <span>Estimated handling / loss</span>
          <span>− ₹{loss.toLocaleString("en-IN")}</span>
        </div>
        <div className="calc-line">
          <span>Expected net</span>
          <span className="calc-total">₹{Math.round(out.net).toLocaleString("en-IN")}</span>
        </div>
        <p className="small" style={{ marginTop: 12 }}>
          About ₹{out.perKg.toFixed(2)} per kg in hand.
        </p>
      </div>
    </div>
  );
}
