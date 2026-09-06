import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("farmer@kisansetu.in");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) setError(msg);
    else nav("/dashboard");
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <Logo />
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Sign in
        </h1>
        <p className="small">Demo accounts share password demo123.</p>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p style={{ color: "#b42318" }}>{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Continue to dashboard"}
        </button>
        <p className="small" style={{ marginTop: 16 }}>
          farmer@kisansetu.in · fpo@kisansetu.in · buyer@kisansetu.in · admin@kisansetu.in
        </p>
        <p className="small">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
