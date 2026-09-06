import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingState } from "../components/States";
import { analyticsService } from "../services/analyticsService";

type Summary = Awaited<ReturnType<typeof analyticsService.summary>>;

export function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    void analyticsService.summary().then(setData);
  }, []);

  if (!data) return <div className="page"><LoadingState /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">A small set of charts for demo reviews. Demo data, not live mandi feeds.</p>
      <div className="grid-2">
        <article className="card">
          <div className="section-label">Market price trend</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={data.priceTrend}>
                <CartesianGrid stroke="#e6eee8" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="tomato" name="Tomato" stroke="#176B45" strokeWidth={2} />
                <Line dataKey="onion" name="Onion" stroke="#E88922" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <div className="section-label">Expected realization</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.realization}>
                <CartesianGrid stroke="#e6eee8" />
                <XAxis dataKey="market" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="net" name="₹/kg net" fill="#176B45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <div className="section-label">Crop volume</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.volume}>
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="kg" fill="#2E8B57" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <div className="section-label">Historical selling decisions</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.decisions}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sell" stackId="a" fill="#176B45" name="Sell" />
                <Bar dataKey="wait" stackId="a" fill="#1f4e79" name="Wait" />
                <Bar dataKey="switch" stackId="a" fill="#E88922" name="Switch" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}
