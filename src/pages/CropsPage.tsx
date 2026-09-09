import { Link } from "react-router-dom";
import { Plus, Sprout } from "lucide-react";
import { CropCard } from "../components/CropCard";
import { EmptyState } from "../components/States";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function CropsPage() {
  const { user } = useAuth();
  const { crops, setActiveCropId } = useAppState();
  const { t } = useLanguage();

  const preferredCropsList: string[] = Array.isArray(user?.preferredCrops)
    ? (user.preferredCrops as string[])
    : typeof user?.preferredCrops === "string"
    ? [(user.preferredCrops as string)]
    : [];
  const profileCrops: string[] = preferredCropsList.filter(
    (pc: string) => !crops.some((c) => c.name.toLowerCase() === pc.toLowerCase())
  );

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)" }}>{t("crops.title", "My Crops")}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", marginTop: 2 }}>
            {t("crops.subtitle", "Manage crop stages, harvest timing, and individual sell/wait/switch recommendations.")}
          </p>
        </div>
        <Link className="btn btn-primary btn-sm" to="/crops/add" style={{ borderRadius: 8 }}>
          <Plus size={15} /> {t("crops.addCrop", "Register New Crop")}
        </Link>
      </div>

      <div className="mt-md">
        {crops.length === 0 && profileCrops.length === 0 ? (
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

            {profileCrops.map((pc) => {
              const matchedAlloc = Array.isArray(user?.cropAllocations)
                ? user.cropAllocations.find((a) => a.crop.toLowerCase() === pc.toLowerCase())
                : null;
              return (
                <div
                  key={pc}
                  className="card card-pad flex flex-between flex-center flex-wrap gap-sm"
                  style={{ background: "#FAFCF9", border: "1.5px dashed var(--green-leaf)", borderRadius: 12 }}
                >
                  <div className="flex flex-center gap-md">
                    <div style={{ fontSize: 26 }}>🌱</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                        {pc} {matchedAlloc && matchedAlloc.area ? `· ${matchedAlloc.area} ${matchedAlloc.unit}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {matchedAlloc && matchedAlloc.area ? `Allocated ${matchedAlloc.area} ${matchedAlloc.unit} in profile` : "Cultivated crop from profile"} · Sowing & stage details needed for AI pricing
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/crops/add?crop=${encodeURIComponent(pc)}`}
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: 8 }}
                  >
                    <Plus size={14} /> Add Tracking Details
                  </Link>
                </div>
              );
            })}
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
