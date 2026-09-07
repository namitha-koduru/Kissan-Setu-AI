import { useState } from "react";
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
  // Primary Marketplace Flow
  { to: "/dashboard", labelKey: "nav.home", defaultLabel: "Home", icon: LayoutDashboard, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/market", labelKey: "nav.market", defaultLabel: "Marketplace", icon: Store, roles: ["farmer", "fpo", "buyer", "admin"], group: "main" },
  { to: "/lots", labelKey: "nav.lots", defaultLabel: "My Lots", icon: Package, roles: ["farmer", "fpo", "buyer"], group: "main" },
  { to: "/offers", labelKey: "nav.offers", defaultLabel: "Buyer Offers", icon: Handshake, roles: ["farmer", "fpo", "buyer"], group: "main" },
  { to: "/transactions", labelKey: "nav.transactions", defaultLabel: "Transactions & Receipts", icon: Truck, roles: ["farmer", "fpo", "buyer"], group: "main" },
  
  // Secondary Intelligence & Farm Tools
  { to: "/chat", labelKey: "nav.askAi", defaultLabel: "Ask KissanSetu AI", icon: Sparkles, roles: ["farmer", "fpo", "buyer", "admin"], group: "tools" },
  { to: "/crops", labelKey: "nav.myCrops", defaultLabel: "My Crops", icon: Sprout, roles: ["farmer", "fpo"], group: "tools" },
  { to: "/weather", labelKey: "nav.weather", defaultLabel: "Weather & Risk", icon: CloudSun, roles: ["farmer", "fpo", "buyer", "admin"], group: "tools" },
  { to: "/recommendation", labelKey: "nav.recommendations", defaultLabel: "Decision Center", icon: Lightbulb, roles: ["farmer", "fpo"], group: "tools" },
  { to: "/buyers", labelKey: "nav.buyers", defaultLabel: "Direct Buyers", icon: Users, roles: ["farmer", "fpo", "admin"], group: "tools" },
  { to: "/fpo", labelKey: "nav.fpo", defaultLabel: "FPO Pooling", icon: Building2, roles: ["farmer", "fpo", "admin"], group: "tools" },
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
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 12px" }} />
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
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryLinks = [
    { to: "/dashboard", label: t("nav.home", "Home"), icon: LayoutDashboard },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/crops", label: t("nav.myCrops", "Crops"), icon: Sprout },
    { to: "/offers", label: t("nav.offers", "Deals"), icon: Handshake },
  ];

  const secondaryLinks = [
    { to: "/lots", label: t("nav.lots", "Harvest Lots"), icon: Package },
    { to: "/transactions", label: t("nav.transactions", "Orders & Receipts"), icon: Truck },
    { to: "/weather", label: t("nav.weather", "Weather Risk"), icon: CloudSun },
    { to: "/recommendation", label: t("nav.recommendations", "Decision Center"), icon: Lightbulb },
    { to: "/chat", label: t("nav.askAi", "Ask AI Assistant"), icon: Sparkles },
    { to: "/buyers", label: t("nav.buyers", "Direct Buyers"), icon: Users },
    { to: "/profile", label: t("nav.profile", "Profile & Settings"), icon: UserCheck },
  ];

  return (
    <>
      {/* Slide-up More Drawer */}
      {moreOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 16px 32px",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
              animation: "slideUp 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>More Features</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {user?.name || "Farmer"} · {user?.district || "India"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                style={{
                  background: "var(--bg-soft)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--ink-soft)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              {secondaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px 8px",
                      borderRadius: 12,
                      background: "var(--bg-warm)",
                      border: "1px solid var(--line)",
                      textDecoration: "none",
                      color: "var(--ink)",
                      gap: 6,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ padding: 6, borderRadius: 8, background: "rgba(23,107,69,0.08)", color: "var(--green-deep)" }}>
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.2 }}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-outline btn-block btn-sm"
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              style={{ borderRadius: 10, borderColor: "var(--danger)", color: "var(--danger)", gap: 6 }}
            >
              <LogOut size={15} />
              <span>{t("nav.signOut", "Sign Out")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 5-Item Bottom Bar */}
      <nav className="bottom-nav" aria-label="Mobile Navigation">
        {primaryLinks.map((l) => {
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

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`bn-item ${moreOpen ? "active" : ""}`}
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: 3, alignItems: "center", justifyContent: "center", height: 19 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
          </div>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
