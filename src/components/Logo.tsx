import { Link } from "react-router-dom";
import { Trees } from "lucide-react";

export function Logo({ to = "/dashboard", className = "" }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={`brand-logo ${className}`}>
      <Trees size={22} color="#2E8B57" strokeWidth={2.2} />
      <span>
        KisanSetu<span className="tag">AI</span>
      </span>
    </Link>
  );
}
