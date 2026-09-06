import { CheckCircle2, X } from "lucide-react";
import { useAppState } from "../context/AppStateContext";

export function ToastContainer() {
  const { toasts, dismissToast } = useAppState();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item">
          <CheckCircle2 size={18} color="#2E8B57" />
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              padding: "2px",
              marginLeft: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
