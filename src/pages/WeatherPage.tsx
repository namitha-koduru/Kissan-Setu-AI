import { useState } from "react";
import { CloudSun, AlertTriangle } from "lucide-react";
import { weatherByLocation, locationOptions } from "../data/demo";

export function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>("Nashik");
  const weather = weatherByLocation[selectedLocation] || weatherByLocation.Nashik;

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
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Weather Risk Intelligence</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            Meteorological models evaluated specifically for crop vulnerability, harvest risk & logistics safety.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink-soft)" }}>District:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", fontWeight: 700 }}
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}, Maharashtra
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="card card-pad" style={{ marginTop: 6, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: "14px", background: "rgba(46,139,87,0.1)", color: "var(--green-deep)" }}>
              <CloudSun size={48} />
            </div>
            <div>
              <div style={{ fontSize: "34px", fontWeight: 800 }}>{weather.currentTempC}°C</div>
              <div style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
                {weather.condition} · Rain Risk: <strong>{weather.rainProbability}%</strong> · Humidity: <strong>{weather.humidity || 62}%</strong>
              </div>
            </div>
          </div>

          <span
            className={`badge-pill ${
              weather.risk === "High" ? "badge-low" : weather.risk === "Medium" ? "badge-medium" : "badge-high"
            }`}
            style={{ fontSize: "14px", padding: "6px 14px" }}
          >
            {weather.risk} Risk Status
          </span>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 12 }}>7-Day Localized Agricultural Forecast</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, overflowX: "auto" }}>
          {weather.forecast.map((w, i) => (
            <div
              key={w.day}
              className="wx-day"
              style={{
                borderTop: i === 0 ? "3px solid var(--green-deep)" : i === 2 || i === 3 ? "3px solid var(--terracotta)" : "1px solid var(--line)",
                minWidth: 100,
              }}
            >
              <div className="d">{w.day}</div>
              <div className="t">{w.tempC}°C</div>
              <div className="r" style={{ color: w.rainProbability > 50 ? "var(--danger)" : "var(--terracotta)" }}>
                {w.rainProbability}% rain
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: 6 }}>
                {w.humidity || 60}% humidity
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agricultural Alert Banner */}
      <div className="card card-pad" style={{ background: "#FFFDF9", border: "1.5px solid #EADBBE" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 10 }}>
          Agricultural Decision Advisory
        </h3>
        <div className="alert-box" style={{ marginTop: 0 }}>
          <AlertTriangle size={20} color="#A85D35" />
          <span>{weather.riskNote}</span>
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            background: "var(--bg-soft)",
            borderRadius: "10px",
            fontSize: "13.5px",
            color: "var(--ink)",
            borderLeft: "4px solid var(--green-leaf)",
          }}
        >
          <strong>Crop Action Strategy:</strong> Consider harvesting near-maturity tomato lots before the Day 3 high-risk precipitation window begins to avoid skin cracking and mandi price downgrades.
        </div>
      </div>
    </div>
  );
}
