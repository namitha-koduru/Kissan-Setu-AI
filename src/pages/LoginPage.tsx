import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
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
            Smarter decisions.<br />
            Better markets.<br />
            Stronger farmers.
          </h2>
          <p>
            AI-powered farm-to-market intelligence combining weather, mandi prices,
            buyer demand, and logistics into one transparent recommendation.
          </p>
          <div className="auth-value-props">
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>Pan-India market intelligence across all states</span>
            </div>
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>Direct farm-to-buyer marketplace</span>
            </div>
            <div className="auth-value-prop">
              <ShieldCheck size={18} />
              <span>Multi-lingual voice AI assistant</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-footer">
          <ShieldCheck size={14} />
          <span>Smart India Hackathon 2026 · SIH26132</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">
            Sign in to access your agricultural decision dashboard.
          </p>

          {/* Role selector */}
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
                {r === "farmer" ? "🌾 Farmer" : r === "fpo" ? "🏛 FPO" : "🏪 Buyer"}
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
                placeholder="e.g. 9876543210 or farmer@email.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
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
              Forgot password?
            </a>

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
              <div className="form-error-alert">
                {error}
              </div>
            )}

            <button
              className={`btn btn-primary btn-block btn-lg ${busy ? "btn-loading" : ""}`}
              disabled={busy}
            >
              {busy ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer-link">
            New to KissanSetu AI?{" "}
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
