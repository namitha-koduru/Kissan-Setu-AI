import { useState } from "react";
import { LogOut, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useAppState } from "../context/AppStateContext";
import type { LanguageCode } from "../types";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  const { onboardData, showToast } = useAppState();

  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [offerAlerts, setOfferAlerts] = useState(true);

  const handleLanguageChange = (code: LanguageCode) => {
    setLang(code);
    showToast(t("profile.success", "Language updated successfully!"));
  };

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>{t("profile.title", "Profile & Farm Settings")}</h1>
          <p className="page-subtitle">
            {t("profile.subtitle", "Manage your account, farm details, language, and notification preferences.")}
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card card-pad mb-lg">
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
              {t("nav.accountRole", "Registered Role")}: <strong>{user?.role?.toUpperCase() || "FARMER"}</strong> · {user?.location || (user?.district ? `${user.district}, ${user.state}` : "India")}
            </p>
          </div>
        </div>

        <div className="pf-row">
          <span className="l">{t("auth.mobile", "Registered Mobile Number")}</span>
          <span className="v">{user?.mobile || "98765 43210"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("auth.email", "Email Address")}</span>
          <span className="v">{user?.email || "farmer@kisansetu.in"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("onboarding.village", "Farm Parcel Location")}</span>
          <span className="v">{onboardData.village || "—"}, {onboardData.district || "—"}, {user?.state || onboardData.state || "—"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("onboarding.landAcreage", "Land Under Cultivation")}</span>
          <span className="v">{user?.landAcreage || onboardData.land || "2.5 acres"}</span>
        </div>
      </div>

      {/* Crops & Preferred Markets */}
      <div className="card card-pad mb-lg">
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("crops.title", "Crops & Preferred Mandis")}
        </h3>
        <div className="pf-row">
          <span className="l">{t("onboarding.primaryCrops", "Registered Crops")}</span>
          <span className="v">{onboardData.crops.length > 0 ? onboardData.crops.join(", ") : "None registered yet"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("market.nearbyMandis", "Tracked Mandi Hubs")}</span>
          <span className="v">{onboardData.markets.length > 0 ? onboardData.markets.join(", ") : `${user?.district || "Local"} APMC Central Mandi`}</span>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className="card card-pad mb-lg">
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("profile.languagePref", "Application Language Preference")}
        </h3>
        <div className="lang-grid">
          {(Object.keys(languages) as LanguageCode[]).map((code) => {
            const isSelected = lang === code;
            return (
              <div
                key={code}
                className={`lang-opt ${isSelected ? "selected" : ""}`}
                onClick={() => handleLanguageChange(code)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{languages[code].native} ({languages[code].name})</span>
                  {isSelected && <Check size={16} color="#176B45" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card card-pad mb-xl">
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("nav.notifications", "Notification & Alert Preferences")}
        </h3>
        <div className="pf-row">
          <span className="l">{t("market.title", "Real-time Mandi Price Surge Alerts")}</span>
          <button
            type="button"
            className={`btn btn-sm ${priceAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPriceAlerts(!priceAlerts)}
          >
            {priceAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">{t("weather.title", "Severe Weather Risk & Harvest Window Warnings")}</span>
          <button
            type="button"
            className={`btn btn-sm ${weatherAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setWeatherAlerts(!weatherAlerts)}
          >
            {weatherAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">{t("offers.title", "Instant Direct Buyer Procurement Offers")}</span>
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
        <LogOut size={16} /> {t("nav.signOut", "Sign Out of Session")}
      </button>
    </div>
  );
}

export default ProfilePage;
