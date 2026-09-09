import { useNavigate } from "react-router-dom";
import { DecisionBadge } from "./DecisionBadge";
import type { CropRecord } from "../types";

export function CropCard({
  crop,
  harvestWindow,
  recommendation,
  onSelect,
}: {
  crop: CropRecord;
  harvestWindow?: string;
  recommendation?: CropRecord["recommendation"];
  onSelect?: () => void;
}) {
  const navigate = useNavigate();

  const getStageClass = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes("mature") || s.includes("ready")) return "mature";
    if (s.includes("vegetative") || s.includes("growing")) return "growing";
    if (s.includes("flowering")) return "flowering";
    if (s.includes("harvested")) return "harvested";
    return "growing";
  };

  const handleClick = () => {
    if (onSelect) onSelect();
    navigate(`/crops/${crop.id}`);
  };

  return (
    <div className="crop-card" onClick={handleClick}>
      <div className="crop-main">
        <div className="crop-icon">{crop.icon || "🌱"}</div>
        <div>
          <div className="crop-name">
            {crop.name}{" "}
            <span style={{ color: "var(--ink-soft)", fontWeight: 500, fontSize: "12.5px" }}>
              · {crop.variety || `${crop.quantityKg} ${crop.unit || "kg"}`}
            </span>
          </div>
          <div className="crop-meta">
            {crop.acreage ? `${crop.acreage} ${crop.acreageUnit || "Acres"}` : "Area not specified"} · {crop.location} · Harvest window: {harvestWindow || crop.harvestWindow || "2–4 days"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {recommendation && <DecisionBadge decision={recommendation} size="sm" />}
        <span className={`stage-tag ${getStageClass(crop.stage)}`}>{crop.stage}</span>
      </div>
    </div>
  );
}
