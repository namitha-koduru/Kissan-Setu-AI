import { Link } from "react-router-dom";
import type { RecommendationResult } from "../types";
import { DecisionBadge } from "./DecisionBadge";
import { useLanguage } from "../context/LanguageContext";

export function RecommendationCard({ rec }: { rec: RecommendationResult }) {
  const { t } = useLanguage();
  return (
    <article className="card rec-preview">
      <div className="section-label">{t("recommendations.decision")}</div>
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
          <div className="small muted">{t("crops.bestMarket")}</div>
          <strong>{rec.bestMarket.name}</strong>
        </div>
      </div>
      <p style={{ marginTop: 12 }}>
        {t("crops.netRealization")} <strong>₹{rec.bestMarket.netPerKg}/kg</strong>
      </p>
      <p className="small">{rec.reasons[0]}</p>
      <Link className="btn btn-primary" to="/recommendation">
        {t("recommendations.title")}
      </Link>
    </article>
  );
}
