import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function RegisterPage() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await register({ name, email, password, role, location: location || "Maharashtra" });
    setBusy(false);
    nav("/dashboard");
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <Logo />
        <h1 className="page-title" style={{ marginTop: 16 }}>
          Create account
        </h1>
        <p className="small">Register to access AI decision recommendations, mandi price forecasts, and verified buyer matching.</p>
        <div className="field">
          <label htmlFor="name">Full name / organisation</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
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
          <label htmlFor="role">I am a</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="farmer">Farmer</option>
            <option value="fpo">FPO</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="loc">Location</label>
          <input
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nashik, Maharashtra"
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Creating…" : "Get started"}
        </button>
        <p className="small" style={{ marginTop: 12 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
