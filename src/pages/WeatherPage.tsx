import { useState } from "react";
import { CloudSun, AlertTriangle } from "lucide-react";
import { weatherByLocation, locationOptions } from "../data/demo";
import { useLanguage } from "../context/LanguageContext";

export function WeatherPage() {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<string>("Nashik");
  const weather = weatherByLocation[selectedLocation] || weatherByLocation.Nashik;

  return (
    <div className="wrap">
      <div className="page-header">
        <div>
          <h1>{t("weather.title", "Weather Risk Intelligence")}</h1>
          <p className="page-subtitle">
            {t("weather.subtitle", "Meteorological models evaluated for crop vulnerability, harvest risk & logistics safety.")}
          </p>
        </div>

        <div className="page-actions">
          <label htmlFor="weather-district" className="text-sm fw-700 text-muted">{t("onboarding.district", "District")}:</label>
          <select
            id="weather-district"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-control"
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="card card-pad mb-lg">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: "14px", background: "rgba(46,139,87,0.1)", color: "var(--green-deep)" }}>
              <CloudSun size={48} />
            </div>
            <div>
              <div style={{ fontSize: "34px", fontWeight: 800 }}>{weather.currentTempC}°C</div>
              <div style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
                {weather.condition} · {t("weather.rainProb", "Rain Risk")}: <strong>{weather.rainProbability}%</strong> · {t("weather.humidity", "Humidity")}: <strong>{weather.humidity || 62}%</strong>
              </div>
            </div>
          </div>

          <span
            className={`badge-pill ${
              weather.risk === "High" ? "badge-low" : weather.risk === "Medium" ? "badge-medium" : "badge-high"
            }`}
            style={{ fontSize: "14px", padding: "6px 14px" }}
          >
            {weather.risk} {t("dashboard.farmRisks", "Risk Status")}
          </span>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="mb-xl">
        <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 12 }}>{t("weather.forecast5d", "7-Day Localized Agricultural Forecast")}</h3>
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
                {w.rainProbability}% {t("weather.rainProb", "rain")}
              </div>
              <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: 6 }}>
                {w.humidity || 60}% {t("weather.humidity", "humidity")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agricultural Alert Banner */}
      <div className="card card-pad" style={{ background: "#FFFDF9", border: "1.5px solid #EADBBE" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 10 }}>
          {t("weather.advisory", "Agricultural Decision Advisory")}
        </h3>
        <div className="alert-box" style={{ marginTop: 0 }}>
          <AlertTriangle size={20} color="#A85D35" />
          <span>{weather.riskNote}</span>
        </div>
        <div className="highlight-box">
          <strong>{t("dashboard.todayAction", "Crop Action Strategy")}:</strong> {t("weather.advisory", "Consider harvesting near-maturity tomato lots before the Day 3 high-risk precipitation window begins to avoid skin cracking and mandi price downgrades.")}
        </div>
      </div>
    </div>
  );
}

export default WeatherPage;
