import { CheckCircle2, Download, Printer, Share2, X, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { TransactionRecord } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord;
}

export function DigitalReceiptModal({ isOpen, onClose, transaction }: Props) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const totalValue = transaction.pricePerKg * transaction.quantityKg;
  const transportCost = 800;
  const mandiFees = 200;
  const netRealization = totalValue - transportCost - mandiFees;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 520, borderRadius: 16, padding: "24px", background: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tricolour accent */}
        <div style={{ height: 3, background: "var(--tricolour-smooth)", margin: "-24px -24px 18px -24px", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />

        <div className="flex flex-between flex-center mb-md">
          <div className="flex flex-center gap-sm">
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--green-deep)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
              KS
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green-deep)" }}>
                KissanSetu AI
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                Verified Digital Transaction Receipt
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Receipt Body */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "16px", background: "var(--bg-warm)", marginBottom: 16 }}>
          <div className="flex flex-between flex-center" style={{ borderBottom: "1px dashed var(--line-strong)", paddingBottom: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", textTransform: "uppercase" }}>Transaction ID</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>{transaction.id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", textTransform: "uppercase" }}>Settlement Status</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sell)", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} /> {t("transactions.paid", "Escrow Verified")}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Farmer / Producer</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{transaction.farmerName || "Registered Farmer"}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Vadlamudi, Guntur, AP</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Buyer / Institutional Procurer</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{transaction.buyerName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Direct Procurement Division</div>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--line)", marginBottom: 12 }}>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, fontWeight: 700 }}>{transaction.crop} (Grade A)</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{transaction.quantityKg} kg</span>
            </div>
            <div className="flex flex-between text-sm" style={{ color: "var(--ink-soft)" }}>
              <span>Agreed Rate</span>
              <span>₹{transaction.pricePerKg} / kg (₹{transaction.pricePerKg * 100} / Qtl)</span>
            </div>
            <div className="flex flex-between text-sm" style={{ fontWeight: 700, marginTop: 4, borderTop: "1px solid var(--line)", paddingTop: 4 }}>
              <span>Gross Deal Value</span>
              <span>₹{totalValue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
            <div className="flex flex-between mb-xs">
              <span>Direct Farmgate Logistics</span>
              <span style={{ color: "var(--danger)" }}>-₹{transportCost}</span>
            </div>
            <div className="flex flex-between mb-xs">
              <span>Handling & Platform Processing</span>
              <span style={{ color: "var(--danger)" }}>-₹{mandiFees}</span>
            </div>
            <div className="flex flex-between" style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)", borderTop: "1px solid var(--line-strong)", paddingTop: 8, marginTop: 6 }}>
              <span>Final Net In-Hand Realization</span>
              <span>₹{netRealization.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "var(--ink-muted)", borderTop: "1px dashed var(--line)", paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} color="var(--green-deep)" />
            <span>Encrypted Smart Contract Escrow settlement ID: 0x9f4a...28b1 · SIH 2026</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-sm">
          <button className="btn btn-outline flex-1" type="button" onClick={handlePrint}>
            <Printer size={15} />
            <span>{t("common.print", "Print / PDF")}</span>
          </button>
          <button className="btn btn-primary flex-1" type="button" onClick={onClose}>
            <Download size={15} />
            <span>{t("common.save", "Done")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
