import { Clock } from "lucide-react";

export function HarvestTimeline({
  windowLabel,
  stage,
  action,
}: {
  windowLabel: string;
  stage: string;
  risk?: string;
  action: string;
}) {
  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800 }}>AI-Assisted Harvest & Selling Window</h3>
        <span className="demo-tag">{windowLabel}</span>
      </div>

      <div className="hl-timeline">
        <div className="hl-node done">
          <div className="bar" />
          <div className="lbl">Sowing & Germination</div>
        </div>
        <div className="hl-node done">
          <div className="bar" />
          <div className="lbl">Vegetative Growth</div>
        </div>
        <div className={`hl-node ${stage.toLowerCase().includes("near") || stage.toLowerCase().includes("ready") ? "done" : "window"}`}>
          <div className="bar" />
          <div className="lbl">Near Maturity</div>
        </div>
        <div className="hl-node window">
          <div className="bar" />
          <div className="lbl">Optimal Harvest Window</div>
        </div>
        <div className="hl-node risk">
          <div className="bar" />
          <div className="lbl">Elevated Weather Risk</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "13px", color: "var(--ink-soft)" }}>
        <Clock size={16} color="#176B45" />
        <span>Current Action Strategy: <strong>{action}</strong></span>
      </div>

      <p className="disclaimer">
        ℹ️ This is an AI-assisted decision estimate combining crop growth stage with predictive meteorological trends. Field conditions and micro-climates may vary.
      </p>
    </div>
  );
}
