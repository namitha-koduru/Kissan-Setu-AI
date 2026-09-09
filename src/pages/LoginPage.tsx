import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { UserRole, LanguageCode } from "../types";

export function LoginPage() {
  const { user, login } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  const nav = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    if (user.role === "fpo") return <Navigate to="/fpo" replace />;
    if (user.role === "buyer") return <Navigate to="/buyers" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const msg = await login(email, password, selectedRole);
    setBusy(false);
    if (msg) {
      setError(msg);
    } else {
      if (selectedRole === "fpo") nav("/fpo");
      else if (selectedRole === "buyer") nav("/buyers");
      else nav("/dashboard");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <Logo to="/" />
        <div>
          <h2>
            {t("landing.tagline", "From knowing the market price to knowing the best action.")}
          </h2>
          <p>
            {t(
              "landing.heroSubtitle",
              "AI-powered farm-to-market intelligence combining weather, mandi prices, buyer demand, and logistics into one transparent recommendation.",
            )}
          </p>
          <div className="auth-value-props">
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>
                {t(
                  "landing.verifiedIntelligence",
                  "Pan-India market intelligence across all states",
                )}
              </span>
            </div>
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>{t("landing.directBuyerLink", "Direct farm-to-buyer marketplace")}</span>
            </div>
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>{t("landing.farmerAdvantage", "Multi-lingual voice AI assistant")}</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-footer">
          <ShieldCheck size={14} />
          <span>{t("nav.credit", "Skill Squad · SIH26132")}</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <h2>
            {selectedRole === "farmer"
              ? t("auth.farmerLoginTitle", "Farmer Sign In")
              : selectedRole === "fpo"
              ? t("auth.fpoLoginTitle", "FPO Sign In")
              : t("auth.buyerLoginTitle", "Buyer Procurement Sign In")}
          </h2>
          <p className="auth-subtitle">
            {selectedRole === "farmer"
              ? t("auth.farmerLoginSubtitle", "Access your crops, live market rates, weather risk, and buyer offers.")
              : selectedRole === "fpo"
              ? t("auth.fpoLoginSubtitle", "Manage member farmers, aggregated bulk lots, and institutional demand.")
              : t("auth.buyerLoginSubtitle", "Discover verified produce supply, create bids, and track trade logistics.")}
          </p>

          {/* Role selector tabs */}
          <div className="role-tabs">
            {(["farmer", "fpo", "buyer"] as const).map((r) => (
              <div
                key={r}
                className={`role-tab ${selectedRole === r ? "active" : ""}`}
                onClick={() => handleRoleSelect(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleRoleSelect(r)}
              >
                {r === "farmer"
                  ? `🌾 ${t("auth.roleFarmer", "Farmer")}`
                  : r === "fpo"
                  ? `🏛 ${t("auth.roleFpo", "FPO")}`
                  : `🏪 ${t("auth.roleBuyer", "Buyer")}`}
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">{t("auth.mobile", "Mobile Number or Email")}</label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. 9848022338 or user@kisansetu.demo"
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">{t("auth.password", "Password")}</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
              {t("auth.forgotPassword", "Forgot password?")}
            </a>

            <div className="field">
              <label htmlFor="lang">{t("profile.languagePref", "Preferred Language")}</label>
              <select
                id="lang"
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
              >
                {(Object.keys(languages) as LanguageCode[]).map((code) => (
                  <option key={code} value={code}>
                    {languages[code].native} ({languages[code].name})
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="form-error-alert">{error}</div>}

            <button
              className={`btn btn-primary btn-block btn-lg ${busy ? "btn-loading" : ""}`}
              disabled={busy}
            >
              {busy
                ? `${t("common.loading", "Signing In...")}`
                : selectedRole === "farmer"
                ? t("auth.farmerLoginBtn", "Sign In as Farmer")
                : selectedRole === "fpo"
                ? t("auth.fpoLoginBtn", "Sign In as FPO")
                : t("auth.buyerLoginBtn", "Sign In as Buyer")}
            </button>
          </form>

          <div className="auth-footer-link">
            {t("auth.noAccount", "New to KissanSetu AI?")}{" "}
            <Link to="/register">{t("auth.registerButton", "Create Account")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
