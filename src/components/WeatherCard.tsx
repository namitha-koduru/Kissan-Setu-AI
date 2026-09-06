import { AlertTriangle, CloudRain, Sun, Cloud } from "lucide-react";
import type { WeatherSnapshot } from "../types";

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Weather Intelligence</h3>
          <p style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>{weather.location}</p>
        </div>
        <span
          className={`badge-pill ${
            weather.risk === "High" ? "badge-low" : weather.risk === "Medium" ? "badge-medium" : "badge-high"
          }`}
        >
          {weather.risk} Risk Period
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "14px 0" }}>
        <div style={{ fontSize: "36px" }}>
          {weather.condition.toLowerCase().includes("rain") ? (
            <CloudRain size={40} color="#17324D" />
          ) : weather.condition.toLowerCase().includes("cloud") ? (
            <Cloud size={40} color="#2E8B57" />
          ) : (
            <Sun size={40} color="#E88922" />
          )}
        </div>
        <div>
          <div style={{ fontSize: "28px", fontWeight: 800 }}>{weather.currentTempC}°C</div>
          <div style={{ color: "var(--ink-soft)", fontSize: "13px" }}>
            {weather.condition} · Rain Probability: <strong>{weather.rainProbability}%</strong>
            {weather.humidity ? ` · Humidity: ${weather.humidity}%` : ""}
          </div>
        </div>
      </div>

      <div className="wx-strip">
        {weather.forecast.slice(0, 3).map((w, i) => (
          <div key={w.day} className="wx-day" style={{ borderTop: i === 0 ? "2px solid var(--green-deep)" : undefined }}>
            <div className="d">{w.day}</div>
            <div className="t">{w.tempC}°</div>
            <div className="r">{w.rainProbability}% rain</div>
          </div>
        ))}
      </div>

      <div className="alert-box">
        <AlertTriangle size={18} color="#A85D35" />
        <span>{weather.riskNote}</span>
      </div>
    </div>
  );
}
