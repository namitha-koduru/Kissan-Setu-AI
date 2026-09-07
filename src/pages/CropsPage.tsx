import { Link } from "react-router-dom";
import { Plus, Sprout } from "lucide-react";
import { CropCard } from "../components/CropCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function CropsPage() {
  const { crops, setActiveCropId } = useAppState();
  const { t } = useLanguage();

  return (
    <div className="wrap">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>{t("crops.title", "My Crops")}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            {t("crops.subtitle", "Manage crop stages, harvest timing, and individual sell/wait/switch recommendations.")}
          </p>
        </div>
        <Link className="btn btn-primary" to="/crops/add">
          <Plus size={16} /> {t("crops.addCrop", "Register New Crop")}
        </Link>
      </div>

      <div className="mt-md">
        {crops.length === 0 ? (
          <EmptyState
            title={t("crops.noCrops", "No crops registered yet")}
            text={t("crops.subtitle", "Add your first crop to enable AI harvest window predictions and mandi price discovery.")}
            action={
              <Link className="btn btn-primary" to="/crops/add">
                {t("crops.addCrop", "Register Your First Crop")}
              </Link>
            }
          />
        ) : (
          <div className="flex-col gap-md">
            {crops.map((c) => (
              <CropCard
                key={c.id}
                crop={c}
                harvestWindow={c.harvestWindow}
                recommendation={c.recommendation}
                onSelect={() => setActiveCropId(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card card-pad" style={{ marginTop: 24, background: "var(--cream)", border: "1px solid #EADBBE" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sprout size={20} color="#176B45" />
          <h3 style={{ fontSize: "15px", fontWeight: 800 }}>{t("recommendations.cropSuitability", "Crop Growth & Harvest Strategy")}</h3>
        </div>
        <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", marginTop: 6 }}>
          {t("crops.subtitle", "KissanSetu monitors your sowing date and growth cycle against localized meteorological risk alerts. When your crop reaches maturity, our price discovery engine identifies which mandi yields the highest net in-hand realization.")}
        </p>
      </div>
    </div>
  );
}

export default CropsPage;
