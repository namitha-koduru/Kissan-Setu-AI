import { ArrowRightLeft, Clock, ShoppingCart } from "lucide-react";
import type { Decision } from "../types";
import { useLanguage } from "../context/LanguageContext";

export function DecisionBadge({
  decision,
  size = "md",
  className = "",
}: {
  decision: Decision;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { t } = useLanguage();
  const iconSize = size === "sm" ? 13 : size === "lg" ? 18 : 15;

  if (decision === "SELL") {
    return (
      <span className={`decision-badge sell ${className}`} style={{ fontSize: size === "sm" ? 11.5 : size === "lg" ? 15 : 13 }}>
        <ShoppingCart size={iconSize} strokeWidth={2.4} />
        <span>{t("decision.sell")}</span>
      </span>
    );
  }

  if (decision === "WAIT") {
    return (
      <span className={`decision-badge wait ${className}`} style={{ fontSize: size === "sm" ? 11.5 : size === "lg" ? 15 : 13 }}>
        <Clock size={iconSize} strokeWidth={2.4} />
        <span>{t("decision.wait")}</span>
      </span>
    );
  }

  return (
    <span className={`decision-badge switch ${className}`} style={{ fontSize: size === "sm" ? 11.5 : size === "lg" ? 15 : 13 }}>
      <ArrowRightLeft size={iconSize} strokeWidth={2.4} />
      <span>{t("decision.switch")}</span>
    </span>
  );
}
