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
  { to: "/dashboard", labelKey: "nav.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/chat", labelKey: "nav.askAi", defaultLabel: "Ask KissanSetu AI", icon: Sparkles, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/crops", labelKey: "nav.myCrops", defaultLabel: "My Crops", icon: Sprout, roles: ["farmer", "fpo"], group: "farm" },
  { to: "/recommendation", labelKey: "nav.recommendations", defaultLabel: "Decision Center", icon: Lightbulb, roles: ["farmer", "fpo"], group: "farm" },
  { to: "/market", labelKey: "nav.market", defaultLabel: "Market Intel", icon: Store, roles: ["farmer", "fpo", "buyer", "admin"], group: "market" },
  { to: "/buyers", labelKey: "nav.buyers", defaultLabel: "Buyer Marketplace", icon: Users, roles: ["farmer", "fpo", "admin"], group: "market" },
  { to: "/lots", labelKey: "nav.lots", defaultLabel: "My Lots", icon: Package, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/offers", labelKey: "nav.offers", defaultLabel: "Buyer Offers", icon: Handshake, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/transactions", labelKey: "nav.transactions", defaultLabel: "Transactions", icon: Truck, roles: ["farmer", "fpo", "buyer"], group: "trade" },
  { to: "/weather", labelKey: "nav.weather", defaultLabel: "Weather Intel", icon: CloudSun, roles: ["farmer", "fpo", "buyer", "admin"], group: "insights" },
  { to: "/analytics", labelKey: "nav.analytics", defaultLabel: "Farm Analytics", icon: LineChart, roles: ["farmer", "fpo", "admin"], group: "insights" },
  { to: "/fpo", labelKey: "nav.fpo", defaultLabel: "FPO Pooling", icon: Building2, roles: ["farmer", "fpo", "admin"], group: "insights" },
  { to: "/profile", labelKey: "nav.profile", defaultLabel: "Profile & Settings", icon: UserCheck, roles: ["farmer", "fpo", "buyer", "admin"], group: "settings" },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "farmer";

  const filteredItems = navItems.filter((i) => (i.roles as readonly string[]).includes(role));

  let lastGroup = "";

  return (
    <aside className="sidebar">
      <Logo to="/dashboard" className="logo" />
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey, item.defaultLabel);
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
          {user?.role ? `${user.role.toUpperCase()} ${t("nav.accountRole", "Account")}` : t("nav.accountRole", "Account")}
        </div>
        <button
          className="btn btn-secondary btn-sm btn-block"
          type="button"
          onClick={logout}
          style={{ gap: 6 }}
        >
          <LogOut size={14} />
          <span>{t("nav.signOut", "Sign Out")}</span>
        </button>
        <div className="sidebar-foot-credit">
          {t("nav.credit", "Skill Squad · SIH26132")}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t } = useLanguage();
  const mobileLinks = [
    { to: "/dashboard", label: t("nav.home", "Home"), icon: LayoutDashboard },
    { to: "/crops", label: t("nav.myCrops", "Crops"), icon: Sprout },
    { to: "/recommendation", label: t("nav.decide", "Decide"), icon: Lightbulb },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/buyers", label: t("nav.buyers", "Buyers"), icon: Users },
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
