import {
  LayoutDashboard,
  Sprout,
  Store,
  Users,
  Lightbulb,
  Package,
  Handshake,
  Truck,
  CloudSun,
  LineChart,
  Building2,
  UserCheck,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", labelKey: "dashboard", icon: LayoutDashboard, roles: ["farmer", "fpo", "buyer", "admin"] },
  { to: "/crops", label: "My Crops", labelKey: "myCrops", icon: Sprout, roles: ["farmer", "fpo"] },
  { to: "/recommendation", label: "Decision Center", labelKey: "recommendations", icon: Lightbulb, roles: ["farmer", "fpo"] },
  { to: "/market", label: "Market Intel", labelKey: "market", icon: Store, roles: ["farmer", "fpo", "buyer", "admin"] },
  { to: "/buyers", label: "Buyer Marketplace", labelKey: "buyers", icon: Users, roles: ["farmer", "fpo", "admin"] },
  { to: "/lots", label: "My Lots", icon: Package, roles: ["farmer", "fpo", "buyer"] },
  { to: "/offers", label: "Buyer Offers", labelKey: "offers", icon: Handshake, roles: ["farmer", "fpo", "buyer"] },
  { to: "/transactions", label: "Transactions", icon: Truck, roles: ["farmer", "fpo", "buyer"] },
  { to: "/weather", label: "Weather Intel", icon: CloudSun, roles: ["farmer", "fpo", "buyer", "admin"] },
  { to: "/analytics", label: "Farm Analytics", icon: LineChart, roles: ["farmer", "fpo", "admin"] },
  { to: "/fpo", label: "FPO Pooling", icon: Building2, roles: ["farmer", "fpo", "admin"] },
  { to: "/profile", label: "Profile & Settings", icon: UserCheck, roles: ["farmer", "fpo", "buyer", "admin"] },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "farmer";

  return (
    <aside className="sidebar">
      <Logo to="/dashboard" className="logo" />
      <nav className="sidebar-nav">
        {navItems
          .filter((i) => (i.roles as readonly string[]).includes(role))
          .map((item) => {
            const Icon = item.icon;
            const label = "labelKey" in item && item.labelKey ? t(item.labelKey) : item.label;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={onNavigate}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="sidebar-foot">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: "#fff", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>
            {user?.role} ACCOUNT
          </span>
        </div>
        <button
          className="btn btn-secondary btn-sm btn-block"
          type="button"
          onClick={logout}
          style={{ gap: 6 }}
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
        <div style={{ marginTop: 10, fontSize: 11, textAlign: "center", color: "#8ea0af" }}>
          Skill Squad · SIH26132
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const mobileLinks = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/crops", label: "Crops", icon: Sprout },
    { to: "/recommendation", label: "Decide", icon: Lightbulb },
    { to: "/market", label: "Markets", icon: Store },
    { to: "/buyers", label: "Buyers", icon: Users },
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      {mobileLinks.map((l) => {
        const Icon = l.icon;
        return (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{l.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
