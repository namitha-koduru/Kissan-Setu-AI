import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { UserRole, LanguageCode } from "../types";

export function LoginPage() {
  const { user, login } = useAuth();
  const { lang, setLang } = useLanguage();
  const nav = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    if (user.role === "fpo") return <Navigate to="/fpo" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) {
      setError(msg);
    } else {
      if (selectedRole === "fpo") nav("/fpo");
      else nav("/dashboard");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <Logo to="/" />
        <div>
          <h2 style={{ fontSize: "28px", color: "#fff", marginBottom: "14px" }}>
            One platform for the complete farm-to-market decision.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", maxWidth: "420px", lineHeight: 1.6 }}>
            Weather conditions, mandi prices, institutional buyer demand, and transport logistics — combined into one transparent AI recommendation for every lot you grow.
          </p>
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12.5px" }}>
          Government of Maharashtra · Agriculture, FoodTech & Rural Development · SIH 2026
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <h2 style={{ fontSize: "24px", marginBottom: "6px" }}>Welcome Back</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "22px" }}>
            Log in to access your agricultural decision dashboard.
          </p>

          {/* Role selector tabs */}
          <div className="role-tabs">
            {(["farmer", "fpo", "buyer"] as const).map((r) => (
              <div
                key={r}
                className={`role-tab ${selectedRole === r ? "active" : ""}`}
                onClick={() => handleRoleSelect(r)}
              >
                {r === "farmer" ? "Farmer" : r === "fpo" ? "FPO Lead" : "Buyer"}
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Mobile Number or Email</label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. farmer@kisansetu.in"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lang">Preferred Language</label>
              <select
                id="lang"
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            {error && (
              <p style={{ color: "var(--danger)", fontSize: "13.5px", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: "8px" }}>
              {busy ? "Signing In…" : "Sign In to Dashboard"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13.5px", color: "var(--ink-soft)" }}>
            New to KisanSetu AI?{" "}
            <Link to="/onboarding" style={{ color: "var(--green-deep)", fontWeight: 700 }}>
              Create Account (4-Step Setup)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
