import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "../types";

export function PriceChart({
  data,
  title = "Tomato price trend",
}: {
  data: PricePoint[];
  title?: string;
}) {
  return (
    <article className="card">
      <div className="section-label">{title}</div>
      <p className="small">Demo mandi trend — not live prices</p>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#e6eee8" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(v) => [`₹${String(v)}`, "Price/kg"]} />
            <Line type="monotone" dataKey="price" stroke="#176B45" strokeWidth={2.4} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
