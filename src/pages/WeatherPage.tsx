import { useEffect, useMemo, useState } from "react";
import { CloudSun, AlertTriangle, MapPin } from "lucide-react";
import { weatherByLocation, locationOptions } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import weatherApi from "../services/weatherApi";
import type { WeatherSnapshot } from "../types";

export function WeatherPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const initialLoc = useMemo(() => {
    return (
      user?.district ||
      (user?.location ? user.location.split(",")[0].trim() : "") ||
      "Vadlamudi"
    );
  }, [user]);

  const [selectedLocation, setSelectedLocation] = useState<string>(initialLoc);

  useEffect(() => {
    if (user?.district || user?.location) {
      const loc = user.district || user.location.split(",")[0].trim();
      setSelectedLocation(loc);
    }
  }, [user]);

  const availableOptions = useMemo(() => {
    const list = [...locationOptions];
    if (selectedLocation && !list.includes(selectedLocation as any)) {
      list.unshift(selectedLocation as any);
    }
    return list;
  }, [selectedLocation]);

  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherSnapshot | null>(null);

  const fetchWeather = async (loc: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await weatherApi.getWeather(loc);
      setWeatherData(res);
    } catch (err) {
      console.warn("Weather fetch failed for:", loc, err);
      if (weatherByLocation[loc]) {
        setWeatherData(weatherByLocation[loc]);
      } else {
        setError(`Weather data unavailable for ${loc}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      fetchWeather(selectedLocation);
    }
  }, [selectedLocation]);

  const weather =
    weatherData ||
    weatherByLocation[selectedLocation] ||
    weatherByLocation["Vadlamudi"] || {
      location: selectedLocation || "Local Farm",
      currentTempC: 31,
      condition: "Clear Skies",
      rainProbability: 20,
      humidity: 60,
      forecast: [
        { day: "Today", tempC: 31, rainProbability: 20, humidity: 60, condition: "Clear" },
        { day: "Tomorrow", tempC: 32, rainProbability: 15, humidity: 58, condition: "Sunny" },
        { day: "Day 3", tempC: 30, rainProbability: 35, humidity: 65, condition: "Partly cloudy" },
        { day: "Day 4", tempC: 29, rainProbability: 40, humidity: 68, condition: "Light rain" },
        { day: "Day 5", tempC: 31, rainProbability: 20, humidity: 60, condition: "Sunny" },
        { day: "Day 6", tempC: 32, rainProbability: 15, humidity: 55, condition: "Sunny" },
        { day: "Day 7", tempC: 33, rainProbability: 10, humidity: 50, condition: "Sunny" },
      ],
      risk: "Low" as const,
      riskNote: "Stable seasonal conditions across the agricultural tract.",
      demo: true,
    };

  const formatDayName = (dayStr: string) => {
    const lower = dayStr.toLowerCase();
    if (lower === "today") return t("weather.today", "Today");
    if (lower === "tomorrow") return t("weather.tomorrow", "Tomorrow");
    if (lower.includes("3")) return t("weather.day3", "Day 3");
    if (lower.includes("4")) return t("weather.day4", "Day 4");
    if (lower.includes("5")) return t("weather.day5", "Day 5");
    if (lower.includes("6")) return t("weather.day6", "Day 6");
    if (lower.includes("7")) return t("weather.day7", "Day 7");
    return dayStr;
  };

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-md">
            <span className="page-tag">
              IMD & Skymet Intel
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              {t("weather.title", "Agricultural Weather Intelligence")}
            </h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {t(
              "weather.subtitle",
              "Localized forecasts, IMD agromet signals, and spray/irrigation advisories",
            )}
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="location-picker">
          <MapPin size={16} color="var(--green-deep)" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-control"
            style={{ fontWeight: 700, padding: "8px 12px", borderRadius: "10px" }}
          >
            {availableOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <div className="flex flex-between flex-center">
            <span style={{ color: "var(--terracotta)", fontWeight: 700, fontSize: 13.5 }}>
              {error}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => fetchWeather(selectedLocation)}
            >
              Retry Weather
            </button>
          </div>
        </div>
      )}

      {/* Current Weather Card */}
      <div className="card card-pad mb-lg">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                padding: 12,
                borderRadius: "14px",
                background: "rgba(46,139,87,0.1)",
                color: "var(--green-deep)",
              }}
            >
              <CloudSun size={48} />
            </div>
            <div>
              <div style={{ fontSize: "34px", fontWeight: 800 }}>
                {weather.currentTempC}°C
              </div>
              <div style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
                {weather.condition} · {t("weather.rainProb", "Rain Risk")}:{" "}
                <strong>{weather.rainProbability}%</strong> ·{" "}
                {t("weather.humidity", "Humidity")}:{" "}
                <strong>{weather.humidity || 62}%</strong>
              </div>
            </div>
          </div>

          <span
            className={`badge-pill ${
              weather.risk === "High"
                ? "badge-low"
                : weather.risk === "Medium"
                ? "badge-medium"
                : "badge-high"
            }`}
            style={{ fontSize: "14px", padding: "6px 14px" }}
          >
            {weather.risk} {t("dashboard.farmRisks", "Risk Status")}
          </span>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="mb-xl">
        <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: 12 }}>
          {t("weather.forecast5d", "7-Day Localized Agricultural Forecast")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 10,
            overflowX: "auto",
          }}
        >
          {weather.forecast.map((w, i) => (
            <div
              key={w.day}
              className="wx-day"
              style={{
                borderTop:
                  i === 0
                    ? "3px solid var(--green-deep)"
                    : i === 2 || i === 3
                    ? "3px solid var(--terracotta)"
                    : "1px solid var(--line)",
                minWidth: 100,
              }}
            >
              <div className="d">{formatDayName(w.day)}</div>
              <div className="t">{w.tempC}°C</div>
              <div
                className="r"
                style={{
                  color: w.rainProbability > 50 ? "var(--danger)" : "var(--terracotta)",
                }}
              >
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
      <div
        className="card card-pad"
        style={{ background: "#FFFDF9", border: "1.5px solid #EADBBE" }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 10 }}>
          {t("weather.advisory", "Agricultural Decision Advisory")}
        </h3>
        <div className="alert-box" style={{ marginTop: 0 }}>
          <AlertTriangle size={20} color="#A85D35" />
          <span>{weather.riskNote}</span>
        </div>
        <div className="highlight-box">
          <strong>{t("dashboard.todayAction", "Crop Action Strategy")}:</strong>{" "}
          {t(
            "weather.advisory",
            "Maintain standard spray and harvest schedules according to 4-day dry window.",
          )}
        </div>
      </div>
    </div>
  );
}

export default WeatherPage;
