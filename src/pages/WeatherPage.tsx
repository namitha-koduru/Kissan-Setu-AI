import { useMemo, useState } from "react";
import { CloudSun, AlertTriangle, MapPin } from "lucide-react";
import { weatherByLocation, locationOptions } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { WeatherSnapshot } from "../types";

export function WeatherPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const initialLoc = useMemo(() => {
    if (user?.district && locationOptions.includes(user.district as any)) return user.district;
    if (user?.location) {
      const p = user.location.split(",")[0].trim();
      if (locationOptions.includes(p as any)) return p;
    }
    return user?.district || user?.location?.split(",")[0]?.trim() || "Guntur";
  }, [user]);

  const [selectedLocation, setSelectedLocation] = useState<string>(initialLoc);

  const availableOptions = useMemo(() => {
    const list = [...locationOptions];
    if (user?.district && !list.includes(user.district as any)) {
      list.unshift(user.district as any);
    }
    return list;
  }, [user]);

  const weather: WeatherSnapshot = useMemo(() => {
    if (weatherByLocation[selectedLocation]) {
      return weatherByLocation[selectedLocation];
    }
    // Dynamic localized weather synthesis for any custom Indian district
    const locName = user?.location || `${selectedLocation}, India`;
    return {
      location: locName,
      currentTempC: 31,
      condition: "Partly Cloudy",
      rainProbability: 24,
      humidity: 64,
      forecast: [
        { day: "Today", tempC: 31, rainProbability: 24, humidity: 64, condition: "Partly cloudy" },
        { day: "Tomorrow", tempC: 32, rainProbability: 20, humidity: 60, condition: "Mostly clear" },
        { day: "Day 3", tempC: 30, rainProbability: 35, humidity: 68, condition: "Passing clouds" },
        { day: "Day 4", tempC: 30, rainProbability: 40, humidity: 72, condition: "Light showers" },
        { day: "Day 5", tempC: 31, rainProbability: 25, humidity: 65, condition: "Partly cloudy" },
        { day: "Day 6", tempC: 33, rainProbability: 15, humidity: 58, condition: "Clear skies" },
        { day: "Day 7", tempC: 33, rainProbability: 10, humidity: 54, condition: "Sunny & dry" },
      ],
      risk: "Low",
      riskNote: `Weather conditions across ${selectedLocation} remain stable and favorable for harvest operations.`,
      demo: true,
    };
  }, [selectedLocation, user]);

  return (
    <div className="wrap">
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-xs" style={{ marginBottom: 4 }}>
            <MapPin size={15} color="var(--green-deep)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-deep)" }}>
              {weather.location || `${selectedLocation}, India`}
            </span>
          </div>
          <h1>{t("weather.title", "Weather Risk Intelligence")}</h1>
          <p className="page-subtitle">
            {t("weather.subtitle", "Meteorological models evaluated for crop vulnerability, harvest risk & logistics safety.")}
          </p>
        </div>

        <div className="page-actions flex flex-center gap-sm">
          <label htmlFor="weather-district" className="text-sm fw-700 text-muted">{t("onboarding.district", "District")}:</label>
          <select
            id="weather-district"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-control"
            style={{ minWidth: 160 }}
          >
            {availableOptions.map((loc) => (
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
