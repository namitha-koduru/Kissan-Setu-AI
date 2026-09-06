import { CloudSun } from "lucide-react";
import type { WeatherSnapshot } from "../types";

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  return (
    <article className="card">
      <div className="section-label">Today's weather</div>
      <div className="row space">
        <div>
          <h3 style={{ fontSize: 28, margin: 0 }}>{weather.currentTempC}°C</h3>
          <p className="small" style={{ margin: 0 }}>
            {weather.condition} · Rain probability {weather.rainProbability}%
          </p>
        </div>
        <CloudSun size={32} color="#176B45" aria-hidden />
      </div>
      <p className="small" style={{ marginTop: 12 }}>
        Next 3 days
      </p>
      {weather.forecast.map((d) => (
        <div className="row space" key={d.label} style={{ padding: "6px 0" }}>
          <span>{d.label}</span>
          <span className="muted small">
            {d.tempC}°C — {d.rainProbability}% rain
          </span>
        </div>
      ))}
      <div className="section-label" style={{ marginTop: 12 }}>
        Weather risk
      </div>
      <strong>{weather.risk}</strong>
      <p className="small" style={{ marginTop: 4 }}>
        {weather.riskNote}
      </p>
      <span className="demo-banner">Demo weather</span>
    </article>
  );
}
