import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "../components/MetricCard";

const realizationTrendData = [
  { week: "Week 1", traditional: 22, kisansetu: 25 },
  { week: "Week 2", traditional: 23, kisansetu: 26 },
  { week: "Week 3", traditional: 24, kisansetu: 27.5 },
  { week: "Week 4", traditional: 24.5, kisansetu: 28 },
  { week: "Week 5", traditional: 25, kisansetu: 29.5 },
  { week: "Week 6", traditional: 26, kisansetu: 30 },
  { week: "Week 7", traditional: 26.5, kisansetu: 31 },
];

const cropPerfData = [
  { crop: "Tomato", avgNet: 29, volume: 2400 },
  { crop: "Onion", avgNet: 19.5, volume: 3200 },
  { crop: "Potato", avgNet: 16, volume: 1800 },
  { crop: "Chilli", avgNet: 62, volume: 600 },
];

export function AnalyticsPage() {
  return (
    <div className="wrap">
      <div className="page-header" style={{ padding: "20px 0 14px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Farm & Sales Analytics</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
          Cumulative price realization, volume sold, and transport savings compared against traditional mandi commission agents.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="metric-grid" style={{ marginTop: 6, marginBottom: 20 }}>
        <MetricCard label="Total Harvest Volume" value="8,000 kg" hint="+18% YoY" />
        <MetricCard label="Avg. Net Realization" value="₹26.4/kg" hint="vs ₹22.1/kg traditional" />
        <MetricCard label="Top Realization Mandi" value="Nashik APMC" hint="₹29.0/kg avg" />
        <MetricCard label="Active Trade Lots" value="2 Lots" hint="500 kg tomato live" />
        <MetricCard label="Completed Direct Trades" value="9 Sales" hint="100% on-time settlement" />
      </div>

      {/* Charts Grid */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "15.5px", fontWeight: 800 }}>
              Price Realization: KisanSetu vs Traditional Mandi
            </h3>
            <span className="demo-tag">DEMO METRICS</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realizationTrendData}>
                <defs>
                  <linearGradient id="colorKs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#176B45" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#176B45" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF1EA" vertical={false} />
                <XAxis dataKey="week" stroke="#88988E" fontSize={12} tickLine={false} />
                <YAxis stroke="#88988E" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: unknown) => {
                    const num = typeof val === "number" ? val : Number(val);
                    return [`₹${num.toFixed(1)}/kg`];
                  }}
                  contentStyle={{ backgroundColor: "#fff", borderRadius: 8, border: "1px solid #E2E7DE", fontSize: 13 }}
                />
                <Legend />
                <Area type="monotone" dataKey="kisansetu" name="KisanSetu Net Realization" stroke="#176B45" strokeWidth={2.5} fill="url(#colorKs)" />
                <Area type="monotone" dataKey="traditional" name="Traditional Agent Realization" stroke="#A85D35" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "15.5px", fontWeight: 800 }}>
              Crop-wise Realization (₹/kg)
            </h3>
            <span className="demo-tag">ALL CROPS</span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropPerfData}>
                <CartesianGrid stroke="#EEF1EA" vertical={false} />
                <XAxis dataKey="crop" stroke="#88988E" fontSize={12} tickLine={false} />
                <YAxis stroke="#88988E" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: unknown) => {
                    const num = typeof val === "number" ? val : Number(val);
                    return [`₹${num}/kg`, "Avg Net Realization"];
                  }}
                  contentStyle={{ backgroundColor: "#fff", borderRadius: 8, border: "1px solid #E2E7DE", fontSize: 13 }}
                />
                <Bar dataKey="avgNet" name="Average Net Realization (₹/kg)" fill="#2E8B57" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
