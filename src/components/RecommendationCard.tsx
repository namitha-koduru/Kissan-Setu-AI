import { Link } from "react-router-dom";
import type { RecommendationResult } from "../types";
import { DecisionBadge } from "./DecisionBadge";

export function RecommendationCard({ rec }: { rec: RecommendationResult }) {
  return (
    <article className="card rec-preview">
      <div className="section-label">Recommendation</div>
      <DecisionBadge decision={rec.decision} />
      <p style={{ marginTop: 16 }}>
        {rec.crop} · {rec.quantityKg} kg · {rec.stage}
      </p>
      <div className="grid-3" style={{ marginTop: 12 }}>
        <div>
          <div className="small muted">Weather risk</div>
          <strong>{rec.weatherRisk}</strong>
        </div>
        <div>
          <div className="small muted">Buyer demand</div>
          <strong>{rec.buyerDemand}</strong>
        </div>
        <div>
          <div className="small muted">Best market</div>
          <strong>{rec.bestMarket.name}</strong>
        </div>
      </div>
      <p style={{ marginTop: 12 }}>
        Expected net realization <strong>₹{rec.bestMarket.netPerKg}/kg</strong>
      </p>
      <p className="small">{rec.reasons[0]}</p>
      <Link className="btn btn-primary" to="/recommendation">
        Open AI Decision Center
      </Link>
    </article>
  );
}
