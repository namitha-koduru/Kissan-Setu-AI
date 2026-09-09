import { useState } from "react";
import { MapPin, Navigation, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_LOCATIONS = [
  { village: "Vadlamudi", district: "Guntur", state: "Andhra Pradesh" },
  { village: "Tenali", district: "Guntur", state: "Andhra Pradesh" },
  { village: "Vijayawada", district: "Krishna", state: "Andhra Pradesh" },
  { village: "Niphad", district: "Nashik", state: "Maharashtra" },
  { village: "Lasalgaon", district: "Nashik", state: "Maharashtra" },
  { village: "Baramati", district: "Pune", state: "Maharashtra" },
  { village: "Amravati", district: "Amravati", state: "Maharashtra" },
  { village: "Kolar", district: "Kolar", state: "Karnataka" },
];

export function LocationSelectorModal({ isOpen, onClose }: Props) {
  const { user, updateUserProfile } = useAuth();
  const { updateOnboardData, showToast } = useAppState();
  const { t } = useLanguage();

  const [village, setVillage] = useState(user?.village || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [state, setState] = useState(user?.state || "");
  const [lat, setLat] = useState<number | undefined>(user?.latitude);
  const [lng, setLng] = useState<number | undefined>(user?.longitude);
  const [detecting, setDetecting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const locParts = [village, district, state].filter((p) => p && p.trim().length > 0);
    const locStr = locParts.join(", ");
    updateUserProfile({
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      location: locStr,
      latitude: lat,
      longitude: lng,
    });
    updateOnboardData({
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
    });
    showToast(t("location.updated", `Location updated to ${locStr || "Selected Location"}`));
    onClose();
  };

  const handleSelectPreset = (loc: typeof POPULAR_LOCATIONS[0]) => {
    setVillage(loc.village);
    setDistrict(loc.district);
    setState(loc.state);
  };

  const handleDetectLocation = () => {
    setDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetecting(false);
          const defaultVill = user?.village || (user?.district ? user.district : "My Farm");
          const defaultDist = user?.district || (user?.state ? user.state : "Local District");
          const defaultSt = user?.state || "India";
          setVillage(defaultVill);
          setDistrict(defaultDist);
          setState(defaultSt);
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          showToast(t("location.detected", `Farm location detected via GPS (${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°)`));
        },
        () => {
          setDetecting(false);
          showToast(t("location.fallback", "GPS permission denied or unavailable. Using saved farm location."));
        },
        { timeout: 5000 }
      );
    } else {
      setDetecting(false);
      showToast(t("location.fallback", "GPS not supported on this device. Please enter location."));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 440, borderRadius: 16, padding: "20px 24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-between flex-center mb-md">
          <div className="flex flex-center gap-sm">
            <div style={{ padding: 8, borderRadius: 10, background: "rgba(23,107,69,0.1)", color: "var(--green-deep)" }}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                {t("nav.setLocation", "Set Your Farm Location")}
              </h3>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>
                {t("location.subtitle", "Used to discover nearby mandis, buyers & transport costs")}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* GPS Quick detect */}
        <button
          className="btn btn-outline btn-block mb-md"
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting}
          style={{ justifyContent: "flex-start", gap: 10, padding: "10px 14px", border: "1.5px dashed var(--green-deep)" }}
        >
          <Navigation size={16} color="var(--green-deep)" className={detecting ? "animate-spin" : ""} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {detecting ? t("location.detecting", "Detecting farm GPS...") : t("location.useCurrent", "Use Current Farm GPS Location")}
          </span>
        </button>

        {/* Form Fields */}
        <div className="flex-col gap-sm mb-md">
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>{t("onboarding.village", "Village / Town")}</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Vadlamudi"
              className="form-control"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>{t("onboarding.district", "District")}</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Guntur"
                className="form-control"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>{t("onboarding.state", "State")}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Andhra Pradesh"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Popular agricultural districts */}
        <div className="mb-lg">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: 8 }}>
            {t("location.popularHubs", "Quick Select Agricultural Hubs")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {POPULAR_LOCATIONS.map((loc) => {
              const isSelected = district.toLowerCase() === loc.district.toLowerCase() && village.toLowerCase() === loc.village.toLowerCase();
              return (
                <button
                  key={`${loc.village}-${loc.district}`}
                  type="button"
                  onClick={() => handleSelectPreset(loc)}
                  style={{
                    fontSize: 12,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: isSelected ? "1.5px solid var(--green-deep)" : "1px solid var(--line)",
                    background: isSelected ? "rgba(23,107,69,0.08)" : "var(--bg-soft)",
                    color: isSelected ? "var(--green-deep)" : "var(--ink)",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {isSelected && <Check size={12} />}
                  {loc.village}, {loc.district}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-sm">
          <button className="btn btn-secondary flex-1" onClick={onClose} type="button">
            {t("common.cancel", "Cancel")}
          </button>
          <button className="btn btn-primary flex-1" onClick={handleSave} type="button">
            {t("common.save", "Apply Location")}
          </button>
        </div>
      </div>
    </div>
  );
}
