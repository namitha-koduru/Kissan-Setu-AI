import { useEffect, useState } from "react";
import { WeatherCard } from "../components/WeatherCard";
import { ErrorState, LoadingState } from "../components/States";
import { locationOptions } from "../data/demo";
import { weatherService } from "../services/weatherService";
import type { WeatherSnapshot } from "../types";

export function WeatherPage() {
  const [location, setLocation] = useState("Nashik");
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    weatherService
      .get(location)
      .then((w) => {
        if (alive) setWeather(w);
      })
      .catch(() => {
        if (alive) setError("Weather data unavailable");
      });
    return () => {
      alive = false;
    };
  }, [location]);

  return (
    <div className="page">
      <h1 className="page-title">Weather risk</h1>
      <p className="page-sub">
        Weather supports harvest and selling decisions. It is not the product — market linkage is.
      </p>
      <div className="field" style={{ maxWidth: 280 }}>
        <label htmlFor="loc">Location</label>
        <select id="loc" value={location} onChange={(e) => setLocation(e.target.value)}>
          {locationOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {error && <ErrorState title="Weather data unavailable" text={error} />}
      {!weather && !error && <LoadingState />}
      {weather && (
        <div className="grid-2">
          <WeatherCard weather={weather} />
          <article className="card">
            <div className="section-label">How weather is used</div>
            <p>Rain probability raises weather risk after Day 2 in Nashik demo data.</p>
            <p>If crop is near maturity and demand is high, increasing rain risk supports SELL NOW.</p>
            <p>If crop is still vegetative and rain risk is low, WAIT is more likely.</p>
          </article>
        </div>
      )}
    </div>
  );
}
