import { useState } from "react";
import { X, FlaskConical, Check, AlertCircle, Info, Sparkles } from "lucide-react";
import { soilApi } from "../services/soilApi";
import type { SoilProfileInput, SoilInterpretation } from "../services/soilApi";
import { useLanguage } from "../context/LanguageContext";

interface SoilFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSoil?: SoilInterpretation | null;
  farmerId?: number;
  onSaved: (updated: SoilInterpretation) => void;
}

const SOIL_TYPES = [
  "Black",
  "Red",
  "Alluvial",
  "Loamy",
  "Sandy",
  "Clay",
  "Laterite",
  "Other",
];

export function SoilFormModal({
  isOpen,
  onClose,
  currentSoil,
  farmerId = 1,
  onSaved,
}: SoilFormModalProps) {
  const { t } = useLanguage();
  const profile = currentSoil?.profile;

  const [soilType, setSoilType] = useState<string>(profile?.soil_type || "Black");
  const [ph, setPh] = useState<string>(profile?.ph !== undefined && profile?.ph !== null ? String(profile.ph) : "7.2");
  const [phUnknown, setPhUnknown] = useState<boolean>(profile?.ph === null || profile?.ph === undefined);
  
  const [nitrogen, setNitrogen] = useState<string>(profile?.nitrogen !== undefined && profile?.nitrogen !== null ? String(profile.nitrogen) : "240");
  const [nitrogenUnknown, setNitrogenUnknown] = useState<boolean>(profile?.nitrogen === null || profile?.nitrogen === undefined);

  const [phosphorus, setPhosphorus] = useState<string>(profile?.phosphorus !== undefined && profile?.phosphorus !== null ? String(profile.phosphorus) : "18.5");
  const [potassium, setPotassium] = useState<string>(profile?.potassium !== undefined && profile?.potassium !== null ? String(profile.potassium) : "295");
  const [organicCarbon, setOrganicCarbon] = useState<string>(profile?.organic_carbon !== undefined && profile?.organic_carbon !== null ? String(profile.organic_carbon) : "0.58");
  const [moisture, setMoisture] = useState<string>(profile?.moisture !== undefined && profile?.moisture !== null ? String(profile.moisture) : "25");
  const [source, setSource] = useState<string>(profile?.source || "Soil Health Card");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const payload: SoilProfileInput = {
        farmer_id: farmerId,
        soil_type: soilType,
        ph: phUnknown ? null : (ph.trim() ? parseFloat(ph) : null),
        nitrogen: nitrogenUnknown ? null : (nitrogen.trim() ? parseFloat(nitrogen) : null),
        phosphorus: phosphorus.trim() ? parseFloat(phosphorus) : null,
        potassium: potassium.trim() ? parseFloat(potassium) : null,
        organic_carbon: organicCarbon.trim() ? parseFloat(organicCarbon) : null,
        moisture: moisture.trim() ? parseFloat(moisture) : null,
        source: source || "Self Reported",
      };

      if (payload.ph !== null && payload.ph !== undefined) {
        if (payload.ph < 3.0 || payload.ph > 11.0) {
          throw new Error("Soil pH must be between 3.0 and 11.0");
        }
      }

      const res = await soilApi.createOrUpdate(payload);
      setSuccessMsg("Soil profile successfully updated!");
      setTimeout(() => {
        onSaved(res);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save soil profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 24, 18, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          border: "1px solid var(--line)",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "rgba(23, 107, 69, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlaskConical size={22} color="#176B45" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
                Soil Health Profile
              </h2>
              <p style={{ fontSize: "12.5px", color: "var(--ink-soft)", margin: "2px 0 0" }}>
                Add or edit your soil test data for accurate crop recommendations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: "8px",
              color: "var(--ink-soft)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: "rgba(23, 107, 69, 0.1)",
              border: "1px solid rgba(23, 107, 69, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#176B45",
              fontSize: "13px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Soil Type */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
              Soil Type
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="input-field"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line-strong)",
                backgroundColor: "#fafaf8",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {SOIL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t} Soil
                </option>
              ))}
            </select>
          </div>

          {/* Soil pH */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                Soil pH (Acidity / Alkalinity)
              </label>
              <label style={{ fontSize: "12px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={phUnknown}
                  onChange={(e) => setPhUnknown(e.target.checked)}
                />
                <span>Not Tested</span>
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="11.0"
                disabled={phUnknown}
                value={phUnknown ? "" : ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="e.g. 7.2"
                className="input-field"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line-strong)",
                  backgroundColor: phUnknown ? "#f0f0ee" : "#fafaf8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
              <span style={{ fontSize: "12.5px", color: "var(--ink-soft)", minWidth: 100 }}>
                {phUnknown
                  ? "Unknown"
                  : parseFloat(ph) < 6.5
                  ? "Acidic"
                  : parseFloat(ph) <= 7.5
                  ? "Neutral / Optimal"
                  : "Alkaline"}
              </span>
            </div>
          </div>

          {/* Available Nitrogen */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                Available Nitrogen (N) <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>(kg/ha)</span>
              </label>
              <label style={{ fontSize: "12px", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={nitrogenUnknown}
                  onChange={(e) => setNitrogenUnknown(e.target.checked)}
                />
                <span>Unknown</span>
              </label>
            </div>
            <input
              type="number"
              step="1"
              min="0"
              disabled={nitrogenUnknown}
              value={nitrogenUnknown ? "" : nitrogen}
              onChange={(e) => setNitrogen(e.target.value)}
              placeholder="e.g. 240 (Low < 280, Medium 280-560)"
              className="input-field"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line-strong)",
                backgroundColor: nitrogenUnknown ? "#f0f0ee" : "#fafaf8",
                fontSize: "14px",
                fontWeight: 600,
              }}
            />
          </div>

          {/* Phosphorus & Potassium Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
                Phosphorus (P) <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>(kg/ha)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
                placeholder="e.g. 18.5"
                className="input-field"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line-strong)",
                  backgroundColor: "#fafaf8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
                Potassium (K) <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>(kg/ha)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
                placeholder="e.g. 295"
                className="input-field"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line-strong)",
                  backgroundColor: "#fafaf8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Organic Carbon & Moisture */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
                Organic Carbon (OC %)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={organicCarbon}
                onChange={(e) => setOrganicCarbon(e.target.value)}
                placeholder="e.g. 0.58"
                className="input-field"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line-strong)",
                  backgroundColor: "#fafaf8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
                Soil Moisture (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                placeholder="e.g. 25"
                className="input-field"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line-strong)",
                  backgroundColor: "#fafaf8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* Test Source */}
          <div>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>
              Data Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input-field"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line-strong)",
                backgroundColor: "#fafaf8",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <option value="Soil Health Card">Soil Health Card (Govt Scheme)</option>
              <option value="KVK / Agri Lab Test">KVK / Agri University Lab Test</option>
              <option value="Private Agronomy Service">Private Agronomy Service</option>
              <option value="Self Reported Estimate">Self-Reported Estimate</option>
            </select>
          </div>

          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "rgba(23, 107, 69, 0.05)",
              borderRadius: "8px",
              border: "1px solid rgba(23, 107, 69, 0.15)",
              fontSize: "12px",
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Info size={15} color="#176B45" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              Partial data is completely acceptable. The KissanSetu Intelligence Engine adapts automatically.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: "10px 18px", borderRadius: "8px" }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, var(--green-deep), var(--green-leaf))",
              }}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? t("common.loading") : t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
