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
  BarChart3,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "farmer";

  // Role-Specific Navigation Definitions (Part 2)
  const farmerNavItems = [
    { to: "/dashboard", label: t("nav.home", "Home"), icon: LayoutDashboard },
    { to: "/crops", label: t("nav.myCrops", "Crops"), icon: Sprout },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/offers", label: t("nav.offers", "Deals"), icon: Handshake },
    { to: "/lots", label: t("nav.lots", "Lots"), icon: Package },
    { to: "/weather", label: t("nav.weather", "Weather"), icon: CloudSun },
    { to: "/recommendation", label: t("nav.recommendations", "Decision Center"), icon: Lightbulb },
    { to: "/chat", label: t("nav.askAi", "AI Assistant"), icon: Sparkles },
    { to: "/transactions", label: t("nav.transactions", "Transactions"), icon: Truck },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const fpoNavItems = [
    { to: "/fpo", label: t("nav.fpoDashboard", "FPO Dashboard"), icon: Building2 },
    { to: "/fpo?tab=members", label: t("nav.members", "Members"), icon: Users },
    { to: "/fpo?tab=aggregation", label: t("nav.aggregation", "Aggregation"), icon: Layers },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/buyers", label: t("nav.buyers", "Buyers"), icon: ShoppingBag },
    { to: "/lots", label: t("nav.bulkLots", "Bulk Lots"), icon: Package },
    { to: "/offers", label: t("nav.offers", "Deals"), icon: Handshake },
    { to: "/transactions", label: t("nav.transactions", "Transactions"), icon: Truck },
    { to: "/analytics", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const buyerNavItems = [
    { to: "/buyers", label: t("nav.procurement", "Procurement"), icon: ShoppingBag },
    { to: "/lots", label: t("nav.availableLots", "Available Lots"), icon: Package },
    { to: "/market", label: t("nav.marketPrices", "Market Prices"), icon: Store },
    { to: "/offers", label: t("nav.offers", "Offers"), icon: Handshake },
    { to: "/transactions", label: t("nav.deals", "Deals & Transactions"), icon: Truck },
    { to: "/analytics", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const currentNavItems =
    role === "fpo" ? fpoNavItems : role === "buyer" ? buyerNavItems : farmerNavItems;

  const homeUrl = role === "fpo" ? "/fpo" : role === "buyer" ? "/buyers" : "/dashboard";

  return (
    <aside className="sidebar">
      <Logo to={homeUrl} className="logo" />
      <div
        style={{
          padding: "4px 14px 10px",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 10,
        }}
      >
        {role === "farmer"
          ? `🌾 ${t("auth.roleFarmer", "Farmer Producer")}`
          : role === "fpo"
          ? `🏛 ${t("auth.roleFpo", "FPO Aggregator")}`
          : `🏪 ${t("auth.roleBuyer", "Buyer Procurement")}`}
      </div>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={onNavigate}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
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
  const role = user?.role ?? "farmer";

  // Role-Specific Mobile Primary Links (Part 3)
  const farmerPrimary = [
    { to: "/dashboard", label: t("nav.home", "Home"), icon: LayoutDashboard },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/crops", label: t("nav.myCrops", "Crops"), icon: Sprout },
    { to: "/offers", label: t("nav.offers", "Deals"), icon: Handshake },
  ];

  const fpoPrimary = [
    { to: "/fpo", label: t("nav.overview", "Home"), icon: Building2 },
    { to: "/fpo?tab=aggregation", label: t("nav.aggregation", "Aggregation"), icon: Layers },
    { to: "/buyers", label: t("nav.buyers", "Demand"), icon: ShoppingBag },
    { to: "/offers", label: t("nav.offers", "Deals"), icon: Handshake },
  ];

  const buyerPrimary = [
    { to: "/buyers", label: t("nav.procurement", "Home"), icon: ShoppingBag },
    { to: "/lots", label: t("nav.lots", "Market"), icon: Package },
    { to: "/offers", label: t("nav.offers", "Offers"), icon: Handshake },
    { to: "/transactions", label: t("nav.deals", "Deals"), icon: Truck },
  ];

  // Role-Specific Mobile Secondary Drawer Links (More)
  const farmerSecondary = [
    { to: "/weather", label: t("nav.weather", "Weather"), icon: CloudSun },
    { to: "/recommendation", label: t("nav.recommendations", "Decision Center"), icon: Lightbulb },
    { to: "/chat", label: t("nav.askAi", "AI Assistant"), icon: Sparkles },
    { to: "/lots", label: t("nav.lots", "Lots"), icon: Package },
    { to: "/transactions", label: t("nav.transactions", "Transactions"), icon: Truck },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const fpoSecondary = [
    { to: "/fpo?tab=members", label: t("nav.members", "Members"), icon: Users },
    { to: "/lots", label: t("nav.bulkLots", "Bulk Lots"), icon: Package },
    { to: "/market", label: t("nav.market", "Markets"), icon: Store },
    { to: "/transactions", label: t("nav.transactions", "Transactions"), icon: Truck },
    { to: "/analytics", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const buyerSecondary = [
    { to: "/market", label: t("nav.marketPrices", "Market Prices"), icon: Store },
    { to: "/analytics", label: t("nav.analytics", "Analytics"), icon: BarChart3 },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: UserCheck },
  ];

  const primaryLinks =
    role === "fpo" ? fpoPrimary : role === "buyer" ? buyerPrimary : farmerPrimary;
  const secondaryLinks =
    role === "fpo" ? fpoSecondary : role === "buyer" ? buyerSecondary : farmerSecondary;

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)" }}>
                  {t("nav.moreFeatures", "More Features")}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {user?.name || "User"} · {user?.district || user?.state || "India"}
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                marginBottom: 20,
              }}
            >
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
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 8,
                        background: "rgba(23,107,69,0.08)",
                        color: "var(--green-deep)",
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.2 }}>
                      {item.label}
                    </span>
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
              style={{
                borderRadius: 10,
                borderColor: "var(--danger)",
                color: "var(--danger)",
                gap: 6,
              }}
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
          <div
            style={{
              display: "flex",
              gap: 3,
              alignItems: "center",
              justifyContent: "center",
              height: 19,
            }}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />
          </div>
          <span>{t("nav.more", "More")}</span>
        </button>
      </nav>
    </>
  );
}
