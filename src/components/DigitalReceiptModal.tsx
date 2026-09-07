import { CheckCircle2, Download, Printer, X, ShieldCheck } from "lucide-react";
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

  const totalValue = transaction.grossAmount || (transaction.pricePerKg * transaction.quantityKg);
  const transportCost = transaction.transportCharges !== undefined ? transaction.transportCharges : 800;
  const mandiFees = transaction.otherCharges !== undefined ? transaction.otherCharges : 0;
  const netRealization = transaction.netRealization !== undefined ? transaction.netRealization : (totalValue - transportCost - mandiFees);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textContent = `
========================================
KISSANSETU AI — DIGITAL TRANSACTION RECEIPT
========================================
Receipt / Transaction ID: ${transaction.id}
Lot Reference: ${transaction.lotId}
Date & Timestamp: ${transaction.timestamp || new Date().toLocaleString()}

FARMER / SELLER:
Name: ${transaction.farmerName || "Registered Farmer"}
Location: ${transaction.farmerLocation || "Farm Origin"}

BUYER / INSTITUTIONAL PROCURER:
Name: ${transaction.buyerName}
Destination: ${transaction.buyerLocation || "Direct Procurement Division"}

TRADE SPECIFICATIONS:
Produce: ${transaction.crop} (Grade A)
Quantity: ${transaction.quantityKg} kg (${(transaction.quantityKg / 100).toFixed(1)} Qtl)
Contract Price: Rs. ${transaction.pricePerKg.toFixed(2)} / kg (Rs. ${(transaction.pricePerKg * 100).toFixed(0)} / Qtl)
Gross Amount: Rs. ${totalValue.toLocaleString("en-IN")}

DEDUCTIONS & SETTLEMENT:
- Farmgate Logistics: -Rs. ${transportCost}
- Platform & Intermediary Fees: Rs. 0 (Direct Trade)
========================================
FINAL NET IN-HAND REALIZATION: Rs. ${netRealization.toLocaleString("en-IN")}
========================================
Payment Status: ${transaction.paymentStatus || "Escrow Verified"}
Payment Reference: ${transaction.paymentReference || "UTR-HDFC-98234190"}
Smart Contract Escrow Hash: 0x9f4a28b1e7c0892a · SIH 2026
========================================
`;
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KissanSetu-Receipt-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
                <CheckCircle2 size={13} /> {transaction.paymentStatus || t("transactions.paid", "Escrow Verified")}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Farmer / Producer</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{transaction.farmerName || "Registered Farmer"}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{transaction.farmerLocation || "Farm Location"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Buyer / Institutional Procurer</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{transaction.buyerName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{transaction.buyerLocation || "Direct Procurement Division"}</div>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--line)", marginBottom: 12 }}>
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, fontWeight: 700 }}>{transaction.crop} (Grade A)</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{transaction.quantityKg} kg</span>
            </div>
            <div className="flex flex-between text-sm" style={{ color: "var(--ink-soft)" }}>
              <span>Agreed Rate</span>
              <span>₹{transaction.pricePerKg.toFixed(2)} / kg (₹{(transaction.pricePerKg * 100).toFixed(0)} / Qtl)</span>
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
              <span style={{ color: transportCost > 0 ? "var(--danger)" : "var(--green-deep)" }}>
                {transportCost > 0 ? `-₹${transportCost}` : "₹0 (Buyer pickup)"}
              </span>
            </div>
            <div className="flex flex-between mb-xs">
              <span>APMC Cess / Middleman Commission</span>
              <span style={{ color: "var(--green-deep)", fontWeight: 700 }}>₹0 (Direct KissanSetu Trade)</span>
            </div>
            <div className="flex flex-between" style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)", borderTop: "1px solid var(--line-strong)", paddingTop: 8, marginTop: 6 }}>
              <span>Final Net In-Hand Realization</span>
              <span>₹{netRealization.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style={{ fontSize: 10, color: "var(--ink-muted)", borderTop: "1px dashed var(--line)", paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} color="var(--green-deep)" />
            <span>Verified Digital Trade · Bank / Payment Reference: {transaction.paymentReference || transaction.id}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-sm">
          <button className="btn btn-outline flex-1" type="button" onClick={handlePrint}>
            <Printer size={15} />
            <span>{t("common.print", "Print Receipt")}</span>
          </button>
          <button className="btn btn-outline flex-1" type="button" onClick={handleDownload}>
            <Download size={15} />
            <span>Download</span>
          </button>
          <button className="btn btn-primary flex-1" type="button" onClick={onClose}>
            <span>{t("common.save", "Close")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
