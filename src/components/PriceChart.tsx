import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "../types";

export function PriceChart({
  data,
  title = "Market Price Trend",
}: {
  data: PricePoint[];
  title?: string;
}) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800 }}>{title}</h3>
        <span className="demo-tag">HISTORICAL & PREDICTIVE MANDI TREND</span>
      </div>
      <div style={{ height: 260, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#176B45" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#176B45" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EEF1EA" vertical={false} />
            <XAxis dataKey="date" stroke="#88988E" fontSize={12} tickLine={false} />
            <YAxis stroke="#88988E" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip
              formatter={(value: unknown) => {
                const numericValue = typeof value === "number" ? value : Number(value);
                return [`₹${numericValue.toFixed(1)}/kg`, "Price"];
              }}
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: 8,
                border: "1px solid #E2E7DE",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#176B45"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
