import { useState } from "react";
import { Link } from "react-router-dom";
import { DecisionBadge } from "../components/DecisionBadge";
import { HarvestTimeline } from "../components/HarvestTimeline";
import { MarketComparison } from "../components/MarketComparison";
import { NetRealizationCalculator } from "../components/NetRealizationCalculator";
import { ErrorState, LoadingState } from "../components/States";
import { useActiveDecision } from "../hooks/useActiveDecision";

export function RecommendationPage() {
  const { crop, rec, loading, error } = useActiveDecision();
  const [showCalc, setShowCalc] = useState(false);

  if (loading) return <div className="page"><LoadingState label="Scoring markets and weather risk…" /></div>;
  if (error || !rec || !crop) {
    return (
      <div className="page">
        <ErrorState text={error ?? "Add a crop first."} />
        <Link className="btn btn-primary" to="/farmer">Add crop</Link>
      </div>
    );
  }

  const actionLabel = rec.decision === "SELL" ? "SELL NOW" : rec.decision;

  return (
    <div className="page">
      <h1 className="page-title">AI Decision Center</h1>
      <p className="page-sub">Transparent scoring for the best selling option. Demo data, explainable rules.</p>

      <section className="hero-decision" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-label" style={{ color: "#d7efe3" }}>Large recommendation</div>
          <h2 style={{ fontSize: 42 }}>{actionLabel}</h2>
          <p className="muted-on-dark">
            {rec.crop} · {rec.quantityKg} kg · {rec.stage}
          </p>
          <p className="muted-on-dark">
            Confidence {rec.confidence} · Expected net ₹{rec.bestMarket.netPerKg}/kg at {rec.bestMarket.name}
          </p>
        </div>
        <DecisionBadge decision={rec.decision} />
      </section>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <article className="metric"><div className="small muted">Crop</div><b>{rec.crop}</b></article>
        <article className="metric"><div className="small muted">Quantity</div><b>{rec.quantityKg} kg</b></article>
        <article className="metric"><div className="small muted">Harvest status</div><b>{rec.stage}</b></article>
        <article className="metric"><div className="small muted">Weather risk</div><b>{rec.weatherRisk}</b></article>
        <article className="metric"><div className="small muted">Buyer demand</div><b>{rec.buyerDemand}</b></article>
        <article className="metric"><div className="small muted">Best market</div><b>{rec.bestMarket.name}</b></article>
      </div>

      <MarketComparison markets={rec.markets} />

      <article className="card" style={{ marginTop: 16 }}>
        <div className="section-label">Why this recommendation?</div>
        <ul>
          {rec.reasons.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
        <button className="btn btn-secondary" type="button" onClick={() => setShowCalc((v) => !v)}>
          {showCalc ? "Hide calculation" : "View calculation"}
        </button>
      </article>

      {showCalc && (
        <div style={{ marginTop: 16 }}>
          <NetRealizationCalculator
            quantityKg={rec.quantityKg}
            sellingPrice={rec.bestMarket.pricePerKg}
            transportCost={rec.bestMarket.transportCost}
            storageCost={rec.bestMarket.storageCost}
            estimatedLoss={Math.round(rec.bestMarket.handlingLossKg * rec.bestMarket.pricePerKg)}
          />
          <p className="small" style={{ marginTop: 8 }}>
            Score inputs: net realization {rec.scoreBreakdown.netRealization}, demand {rec.scoreBreakdown.demand},
            weather pressure {rec.scoreBreakdown.weatherPressure}, crop readiness {rec.scoreBreakdown.readiness}.
          </p>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <HarvestTimeline
          windowLabel={rec.harvestWindow}
          stage={rec.stage}
          risk={rec.weatherRisk}
          action={actionLabel}
        />
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <Link className="btn btn-primary" to="/lots">Create lot</Link>
        <Link className="btn btn-secondary" to="/buyers">See buyers</Link>
        <Link className="btn btn-ghost" to="/market">Open market intel</Link>
      </div>
    </div>
  );
}
