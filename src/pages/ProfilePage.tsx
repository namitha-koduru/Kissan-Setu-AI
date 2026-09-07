import { useState } from "react";
import { LogOut, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useAppState } from "../context/AppStateContext";
import type { LanguageCode } from "../types";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const { onboardData, showToast } = useAppState();

  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [offerAlerts, setOfferAlerts] = useState(true);

  const languages: { code: LanguageCode; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "mr", label: "मराठी (Marathi)" },
    { code: "te", label: "తెలుగు (Telugu)" },
  ];

  const handleLanguageChange = (code: LanguageCode) => {
    setLang(code);
    showToast(`Language switched to ${languages.find((l) => l.code === code)?.label}`);
  };

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>Profile & Farm Settings</h1>
          <p className="page-subtitle">
            Manage your account, farm details, language, and notification preferences.
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            className="avatar"
            style={{ width: 56, height: 56, fontSize: "20px", fontWeight: 800, background: "var(--green-leaf)", color: "#fff" }}
          >
            {user?.initials || "RP"}
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{user?.name || "Ramesh Patil"}</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "13.5px" }}>
              Registered Role: <strong>{user?.role?.toUpperCase() || "FARMER"}</strong> · {user?.location || (user?.district ? `${user.district}, ${user.state}` : "India")}
            </p>
          </div>
        </div>

        <div className="pf-row">
          <span className="l">Registered Mobile Number</span>
          <span className="v">{user?.mobile || "98765 43210"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Email Address</span>
          <span className="v">{user?.email || "farmer@kisansetu.in"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Farm Parcel Location</span>
          <span className="v">{onboardData.village || "—"}, {onboardData.district || "—"}, {user?.state || onboardData.state || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Land Under Cultivation</span>
          <span className="v">{user?.landAcreage || onboardData.land || "2.5 acres"}</span>
        </div>
      </div>

      {/* Crops & Preferred Markets */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          Crops & Preferred Mandis
        </h3>
        <div className="pf-row">
          <span className="l">Registered Crops</span>
          <span className="v">{onboardData.crops.join(", ") || "Tomato, Onion, Potato"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Tracked Mandi Hubs</span>
          <span className="v">{onboardData.markets.join(", ") || "Nashik, Ahmednagar, Pune"}</span>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          Application Language Preference
        </h3>
        <div className="lang-grid">
          {languages.map((l) => {
            const isSelected = lang === l.code;
            return (
              <div
                key={l.code}
                className={`lang-opt ${isSelected ? "selected" : ""}`}
                onClick={() => handleLanguageChange(l.code)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{l.label}</span>
                  {isSelected && <Check size={16} color="#176B45" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          Notification & Alert Preferences
        </h3>
        <div className="pf-row">
          <span className="l">Real-time Mandi Price Surge Alerts</span>
          <button
            type="button"
            className={`btn btn-sm ${priceAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPriceAlerts(!priceAlerts)}
          >
            {priceAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">Severe Weather Risk & Harvest Window Warnings</span>
          <button
            type="button"
            className={`btn btn-sm ${weatherAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setWeatherAlerts(!weatherAlerts)}
          >
            {weatherAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">Instant Direct Buyer Procurement Offers</span>
          <button
            type="button"
            className={`btn btn-sm ${offerAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setOfferAlerts(!offerAlerts)}
          >
            {offerAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <button
        className="btn btn-secondary btn-block"
        type="button"
        onClick={logout}
        style={{ color: "var(--danger)", borderColor: "#F5C6C2", marginBottom: 30 }}
      >
        <LogOut size={16} /> Sign Out of Session
      </button>
    </div>
  );
}
