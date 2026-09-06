import { useState, type FormEvent } from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import buyerMatchingApi from "../services/buyerMatchingApi";

interface Props {
  transactionId: number;
  isOpen: boolean;
  onClose: () => void;
  onDisputeFiled: () => void;
}

export function DisputeModal({ transactionId, isOpen, onClose, onDisputeFiled }: Props) {
  const [category, setCategory] = useState("payment");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setLoading(true);
      const res = await buyerMatchingApi.fileDispute(transactionId, {
        category,
        description,
        raised_by_role: "farmer",
      });
      setSubmittedId(res.id);
      onDisputeFiled();
    } catch (err) {
      console.error("Failed to submit grievance", err);
    } finally {
      setLoading(false);
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className="card card-pad"
        style={{
          maxWidth: 500,
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Report Transaction Issue / Grievance</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {submittedId ? (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#E6F4EA",
                color: "#137333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 800 }}>Grievance Ticket #{submittedId} Registered</h4>
            <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.4 }}>
              Your issue has been logged in the transaction audit trail. Our support and mediation desk will review the records.
            </p>
            <button className="btn btn-primary btn-block" onClick={onClose} style={{ marginTop: 16 }}>
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Issue Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="payment">Payment Delay / Amount Discrepancy</option>
                <option value="quantity">Weighing / Quantity Mismatch</option>
                <option value="quality">Quality Rejection / Grading Dispute</option>
                <option value="delivery">Pickup Delay / Logistics Failure</option>
                <option value="other">Other Transaction Concern</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Describe the Issue</label>
              <textarea
                rows={4}
                placeholder="Provide clear details: e.g. Pickup was scheduled for 8:30 AM but truck has not arrived after 4 hours..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line-strong)" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading || !description.trim()} style={{ flex: 1 }}>
                {loading ? "Submitting..." : "Submit Grievance"}
              </button>
              <button className="btn btn-ghost" type="button" onClick={onClose} style={{ flex: 0.5 }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DisputeModal;
