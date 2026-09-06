import { Link } from "react-router-dom";
import { CropCard } from "../components/CropCard";
import { MarketComparison } from "../components/MarketComparison";
import { MetricCard } from "../components/MetricCard";
import { WeatherCard } from "../components/WeatherCard";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useActiveDecision } from "../hooks/useActiveDecision";
import { fpoFarmers } from "../data/demo";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { crops, setActiveCropId } = useAppState();
  const { rec, weather, loading, error } = useActiveDecision();

  if (user?.role === "fpo") {
    const total = fpoFarmers.reduce((s, f) => s + f.quantityKg, 0);
    return (
      <div className="page">
        <h1 className="page-title">FPO operations</h1>
        <p className="page-sub">{user.name} · {user.location}</p>
        <div className="grid-4">
          <MetricCard label="Total farmers" value="128" />
          <MetricCard label="Total produce" value={`${total.toLocaleString("en-IN")} kg`} hint="Tomato pool (demo)" />
          <MetricCard label="Active lots" value="6" />
          <MetricCard label="Buyer interest" value="9 offers" />
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-label">Aggregate farmer lots</div>
          {fpoFarmers.map((f) => (
            <div className="row space" key={f.name} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span>{f.name}</span>
              <strong>{f.quantityKg} kg</strong>
            </div>
          ))}
          <p>
            Total <strong>{total.toLocaleString("en-IN")} kg</strong>
          </p>
          <Link className="btn btn-primary" to="/lots">
            Create aggregated lot
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page"><LoadingState /></div>;
  if (error) return <div className="page"><ErrorState text={error} /></div>;
  if (!rec || !weather) {
    return (
      <div className="page">
        <EmptyState title="No crops added yet" text="Add a crop to get a sell, wait or switch recommendation." action={<Link className="btn btn-primary" to="/farmer">Create your first crop</Link>} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">
        {greeting()}, {user?.role === "farmer" ? "Farmer" : user?.name.split(" ")[0]}
      </h1>
      <p className="page-sub">
        {user?.location} · {weather.currentTempC}°C · {weather.condition} · Rain probability {weather.rainProbability}%
      </p>

      <section className="hero-decision">
        <div>
          <div className="section-label" style={{ color: "#d7efe3" }}>
            Your next decision
          </div>
          <h2>
            {rec.crop} · {rec.quantityKg} kg
          </h2>
          <p className="muted-on-dark">{rec.stage}</p>
          <div className="rec-pill" style={{ margin: "12px 0" }}>
            AI recommendation · {rec.decision === "SELL" ? "SELL NOW" : rec.decision}
          </div>
          <p className="muted-on-dark">
            Best market: {rec.bestMarket.name}
            <br />
            Expected net realization: ₹{rec.bestMarket.netPerKg}/kg
            <br />
            Confidence: {rec.confidence}
          </p>
          <Link className="btn btn-secondary" to="/recommendation" style={{ marginTop: 8 }}>
            View recommendation
          </Link>
        </div>
        <div>
          <p className="muted-on-dark small">We help you decide what to do — not only what the mandi board shows.</p>
        </div>
      </section>

      <h2 style={{ marginTop: 28 }}>My crops</h2>
      {crops.length === 0 ? (
        <EmptyState title="No crops added yet" text="Create your first crop to unlock market and weather intelligence." />
      ) : (
        <div className="grid-3">
          {crops.map((c) => (
            <CropCard
              key={c.id}
              crop={c}
              harvestWindow={c.name === rec.crop ? rec.harvestWindow : "Open decision center"}
              weatherRisk={weather.risk}
              recommendation={c.name === rec.crop ? rec.decision : "WAIT"}
              onSelect={() => setActiveCropId(c.id)}
            />
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 20 }}>
        <MarketComparison markets={rec.markets} />
        <WeatherCard weather={weather} />
      </div>
    </div>
  );
}
