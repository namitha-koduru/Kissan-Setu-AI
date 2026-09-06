import { useState, useEffect, useRef } from "react";
import { Bell, CloudSun, Menu, MapPin, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
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

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="icon-btn hamburger"
            type="button"
            aria-label="Open navigation menu"
            onClick={onMenu}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-soft)" }}>
            <MapPin size={15} color="#176B45" />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{user?.location || "Nashik, Maharashtra"}</span>
          </div>
        </div>

        <div className="top-actions" ref={panelRef}>
          <LanguageSelector />
          <Link className="icon-btn" to="/weather" title="Weather Intelligence">
            <CloudSun size={19} />
          </Link>

          <div style={{ position: "relative" }}>
            <button
              className="icon-btn"
              type="button"
              title="Notifications"
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <Bell size={19} />
              {unreadNotifsCount > 0 && <span className="dot-badge" />}
            </button>

            {notifOpen && (
              <div className="dropdown-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px 10px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>Notifications</span>
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead()}
                      style={{ background: "none", border: "none", color: "var(--green-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Check size={13} /> Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto", marginTop: 4 }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="dropdown-item"
                      style={{ background: n.read ? "transparent" : "rgba(23,107,69,0.04)" }}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                      }}
                    >
                      <div className="t" style={{ color: n.read ? "inherit" : "var(--green-deep)" }}>
                        {n.title}
                      </div>
                      <div className="s">{n.subtitle}</div>
                      {n.time && <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{n.time}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link className="profile-chip" to="/profile">
            <span className="avatar">{user?.initials || user?.name?.slice(0, 2).toUpperCase() || "RP"}</span>
            <span style={{ display: "none", md: "inline" }}>{user?.name?.split(" ")[0] || "Farmer"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicNav() {
  return (
    <header className="public-topbar">
      <div className="topbar-inner">
        <Logo to="/" />
        <nav className="public-nav-links">
          <a className="public-nav-link" href="#problem">The Problem</a>
          <a className="public-nav-link" href="#how">How It Works</a>
          <a className="public-nav-link" href="#decision">Smart Decision</a>
          <a className="public-nav-link" href="#features">Features</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSelector />
          <Link className="btn btn-outline btn-sm" to="/login">Sign In</Link>
          <Link className="btn btn-primary btn-sm" to="/onboarding">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
