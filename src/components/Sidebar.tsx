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
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", labelKey: "dashboard", icon: LayoutDashboard, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/chat", label: "Ask KissanSetu AI", icon: Sparkles, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/crops", label: "My Crops", labelKey: "myCrops", icon: Sprout, roles: ["farmer", "fpo"], group: "farm" },
  { to: "/recommendation", label: "Decision Center", labelKey: "recommendations", icon: Lightbulb, roles: ["farmer", "fpo"], group: "farm" },
  { to: "/market", label: "Market Intel", labelKey: "market", icon: Store, roles: ["farmer", "fpo", "buyer", "admin"], group: "market" },
  { to: "/buyers", label: "Buyer Marketplace", labelKey: "buyers", icon: Users, roles: ["farmer", "fpo", "admin"], group: "market" },
  { to: "/lots", label: "My Lots", icon: Package, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/offers", label: "Buyer Offers", labelKey: "offers", icon: Handshake, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/transactions", label: "Transactions", icon: Truck, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/weather", label: "Weather Intel", icon: CloudSun, roles: ["farmer", "fpo", "buyer", "admin"], group: "insights" },
  { to: "/analytics", label: "Farm Analytics", icon: LineChart, roles: ["farmer", "fpo", "admin"], group: "insights" },
  { to: "/fpo", label: "FPO Pooling", icon: Building2, roles: ["farmer", "fpo", "admin"], group: "insights" },
  { to: "/profile", label: "Profile & Settings", icon: UserCheck, roles: ["farmer", "fpo", "buyer", "admin"], group: "settings" },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "farmer";

  const filteredItems = navItems.filter((i) => (i.roles as readonly string[]).includes(role));

  // Group items for visual separation
  let lastGroup = "";

  return (
    <aside className="sidebar">
      <Logo to="/dashboard" className="logo" />
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const label = "labelKey" in item && item.labelKey ? t(item.labelKey) : item.label;
          const showDivider = lastGroup && item.group !== lastGroup;
          lastGroup = item.group;

          return (
            <div key={item.to}>
              {showDivider && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 12px" }} />
              )}
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={onNavigate}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-role">
          {user?.role} Account
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
        <div className="sidebar-foot-credit">
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
            <Icon size={18} />
            <span>{l.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
