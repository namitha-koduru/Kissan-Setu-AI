import { CheckCircle2, Download, Printer, X, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { downloadTradeReceiptPdf } from "../utils/pdfGenerator";
import type { TransactionRecord } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord;
}

export function DigitalReceiptModal({ isOpen, onClose, transaction }: Props) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const totalValue =
    transaction.grossAmount !== undefined
      ? transaction.grossAmount
      : transaction.pricePerKg * transaction.quantityKg;
  const transportCost =
    transaction.transportCharges !== undefined ? transaction.transportCharges : 800;
  const mandiFees = transaction.otherCharges !== undefined ? transaction.otherCharges : 0;
  const netRealization =
    transaction.netRealization !== undefined
      ? transaction.netRealization
      : totalValue - transportCost - mandiFees;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadTradeReceiptPdf(transaction);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 520, borderRadius: 16, padding: "24px", background: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tricolour accent */}
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
            margin: "-24px -24px 18px -24px",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        />

        <div className="flex flex-between flex-center mb-md">
          <div className="flex flex-center gap-sm">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--green-deep)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              KS
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green-deep)" }}>
                KissanSetu AI
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                {t("transactions.receiptTitle", "Digital Trade Receipt")}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Receipt Body */}
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "16px",
            background: "var(--bg-warm)",
            marginBottom: 16,
          }}
        >
          <div
            className="flex flex-between flex-center"
            style={{
              borderBottom: "1px dashed var(--line-strong)",
              paddingBottom: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                {t("transactions.txId", "Transaction ID")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)" }}>
                {transaction.id}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                {t("transactions.payment", "Settlement Status")}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--sell)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={13} />{" "}
                {transaction.paymentStatus || t("transactions.paid", "Verified & Settled")}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                {t("auth.roleFarmer", "Farmer / Producer")}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {transaction.farmerName || "Registered Farmer"}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                {transaction.farmerLocation || "Farm Gate Origin"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                {t("auth.roleBuyer", "Buyer / Procurer")}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{transaction.buyerName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                {transaction.buyerLocation || "Direct Procurement Division"}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 8,
              padding: "10px 12px",
              border: "1px solid var(--line)",
              marginBottom: 12,
            }}
          >
            <div className="flex flex-between mb-xs">
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {transaction.crop} (Grade A)
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {transaction.quantityKg} kg
              </span>
            </div>
            <div className="flex flex-between text-sm" style={{ color: "var(--ink-soft)" }}>
              <span>{t("offers.offeredPrice", "Agreed Rate")}</span>
              <span>
                ₹{transaction.pricePerKg.toFixed(2)} / kg (₹
                {(transaction.pricePerKg * 100).toFixed(0)} / Qtl)
              </span>
            </div>
            <div
              className="flex flex-between text-sm"
              style={{
                fontWeight: 700,
                marginTop: 4,
                borderTop: "1px solid var(--line)",
                paddingTop: 4,
              }}
            >
              <span>{t("offers.totalValue", "Gross Produce Value")}</span>
              <span>₹{totalValue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
            <div className="flex flex-between mb-xs">
              <span>{t("market.freightCost", "Transport / Logistics")}</span>
              <span style={{ color: transportCost > 0 ? "var(--danger)" : "var(--green-deep)" }}>
                {transportCost > 0 ? `-₹${transportCost}` : "₹0 (Buyer pickup)"}
              </span>
            </div>
            <div className="flex flex-between mb-xs">
              <span>APMC Middleman Commission</span>
              <span style={{ color: "var(--green-deep)", fontWeight: 700 }}>
                ₹0 (Direct KissanSetu Trade)
              </span>
            </div>
            <div
              className="flex flex-between"
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--green-deep)",
                borderTop: "1px solid var(--line-strong)",
                paddingTop: 8,
                marginTop: 6,
              }}
            >
              <span>{t("market.netInHand", "Net In-Hand Realization")}</span>
              <span>₹{netRealization.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 10,
              color: "var(--ink-muted)",
              borderTop: "1px dashed var(--line)",
              paddingTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShieldCheck size={14} color="var(--green-deep)" />
            <span>
              Digital Verification Reference:{" "}
              {transaction.paymentReference || `SETU-NEFT-2026-${transaction.id}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-sm">
          <button className="btn btn-outline flex-1" type="button" onClick={handlePrint}>
            <Printer size={15} />
            <span>{t("common.print", "Print")}</span>
          </button>
          <button
            className="btn btn-primary flex-1"
            type="button"
            onClick={handleDownloadPdf}
            style={{ background: "var(--green-deep)", borderColor: "var(--green-deep)" }}
          >
            <Download size={15} />
            <span>{t("common.downloadPdf", "Download PDF")}</span>
          </button>
          <button className="btn btn-secondary flex-1" type="button" onClick={onClose}>
            <span>{t("common.close", "Close")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DigitalReceiptModal;
