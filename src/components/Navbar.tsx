import { useState, useEffect, useRef } from "react";
import { Bell, CloudSun, Menu, MapPin, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadNotifsCount, markNotificationAsRead } = useAppState();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locationDisplay = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : t("nav.setLocation", "Set Location"));

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="flex flex-center gap-md">
          <button
            className="icon-btn hamburger"
            type="button"
            aria-label="Open navigation menu"
            onClick={onMenu}
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-center gap-sm" style={{ fontSize: "var(--text-base)", color: "var(--ink-soft)" }}>
            <MapPin size={14} color="var(--green-deep)" />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{locationDisplay}</span>
          </div>
        </div>

        <div className="top-actions" ref={panelRef}>
          <LanguageSelector />
          <Link className="icon-btn" to="/weather" title={t("nav.weather", "Weather Intel")} aria-label="Weather">
            <CloudSun size={18} />
          </Link>

          <div style={{ position: "relative" }}>
            <button
              className="icon-btn"
              type="button"
              title={t("nav.notifications", "Notifications")}
              aria-label={`Notifications${unreadNotifsCount > 0 ? ` (${unreadNotifsCount} unread)` : ""}`}
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && <span className="dot-badge" />}
            </button>

            {notifOpen && (
              <div className="dropdown-panel">
                <div className="flex flex-between flex-center" style={{ padding: "4px 4px 10px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>{t("nav.notifications", "Notifications")}</span>
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead()}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "4px 8px", gap: 4 }}
                    >
                      <Check size={13} /> {t("nav.markAllRead", "Mark all read")}
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto", marginTop: 4 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--ink-muted)", fontSize: "var(--text-sm)" }}>
                      {t("nav.noNotifications", "No notifications yet")}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="dropdown-item"
                        style={{ background: n.read ? "transparent" : "rgba(23,107,69,0.03)" }}
                        onClick={() => markNotificationAsRead(n.id)}
                      >
                        <div className="t" style={{ color: n.read ? "inherit" : "var(--green-deep)" }}>
                          {n.title}
                        </div>
                        <div className="s">{n.subtitle}</div>
                        {n.time && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-muted)", marginTop: 4 }}>{n.time}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link className="profile-chip" to="/profile" aria-label="Profile">
            <span className="avatar">{user?.initials || user?.name?.slice(0, 2).toUpperCase() || "KS"}</span>
            <span>{user?.name?.split(" ")[0] || t("nav.profile", "Profile")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicNav() {
  const { t } = useLanguage();

  return (
    <header className="public-topbar">
      <div className="topbar-inner">
        <Logo to="/" />
        <nav className="public-nav-links">
          <a className="public-nav-link" href="#problem">{t("landing.theProblem", "The Problem")}</a>
          <a className="public-nav-link" href="#how">{t("landing.howItWorks", "How It Works")}</a>
          <a className="public-nav-link" href="#decision">{t("landing.smartDecision", "Smart Decision")}</a>
          <a className="public-nav-link" href="#features">{t("landing.features", "Features")}</a>
        </nav>
        <div className="flex flex-center gap-sm">
          <LanguageSelector />
          <Link className="btn btn-outline btn-sm" to="/login">{t("landing.signIn", "Sign In")}</Link>
          <Link className="btn btn-primary btn-sm" to="/register">{t("landing.getStarted", "Get Started")}</Link>
        </div>
      </div>
    </header>
  );
}
