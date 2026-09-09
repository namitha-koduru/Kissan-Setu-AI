import { Link } from "react-router-dom";
import logoImg from "../assets/kisansetu-logo.png";

export function Logo({
  to = "/dashboard",
  className = "",
  size = 32,
  showText = true,
}: {
  to?: string;
  className?: string;
  size?: number;
  showText?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`brand-logo ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}
    >
      <img
        src={logoImg}
        alt="KissanSetu AI"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      {showText && (
        <span style={{ fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em", color: "var(--navy)" }}>
          KissanSetu<span className="tag" style={{ marginLeft: 3, color: "var(--green-deep)" }}>AI</span>
        </span>
      )}
    </Link>
  );
}
