import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sprout, Building2, Store, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function RegisterPage() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>("farmer");
  
  // Farmer fields
  const [fullName, setFullName] = useState("");
  const [farmerMobile, setFarmerMobile] = useState("");
  const [farmerEmail, setFarmerEmail] = useState("");
  const [farmerPassword, setFarmerPassword] = useState("");
  const [farmerConfirmPassword, setFarmerConfirmPassword] = useState("");

  // FPO fields
  const [fpoName, setFpoName] = useState("");
  const [fpoLeadName, setFpoLeadName] = useState("");
  const [fpoMobile, setFpoMobile] = useState("");
  const [fpoEmail, setFpoEmail] = useState("");
  const [fpoPassword, setFpoPassword] = useState("");
  const [fpoConfirmPassword, setFpoConfirmPassword] = useState("");

  // Buyer fields
  const [buyerOrgName, setBuyerOrgName] = useState("");
  const [buyerContactPerson, setBuyerContactPerson] = useState("");
  const [buyerMobile, setBuyerMobile] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPassword, setBuyerPassword] = useState("");
  const [buyerConfirmPassword, setBuyerConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If user is already logged in and has completed onboarding, redirect to their role home
  if (user && user.onboarded) {
    if (user.role === "fpo") return <Navigate to="/fpo" replace />;
    if (user.role === "buyer") return <Navigate to="/buyers" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  // If user is logged in but hasn't onboarded, redirect to onboarding
  if (user && !user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let name = "";
    let mobile = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let organizationName = "";
    let contactPerson = "";

    if (selectedRole === "farmer") {
      name = fullName.trim();
      mobile = farmerMobile.trim();
      email = farmerEmail.trim();
      password = farmerPassword;
      confirmPassword = farmerConfirmPassword;

      if (!name) {
        setError("Please enter your full name.");
        return;
      }
      if (!mobile) {
        setError("Please enter your mobile number for account verification.");
        return;
      }
    } else if (selectedRole === "fpo") {
      organizationName = fpoName.trim();
      name = organizationName;
      contactPerson = fpoLeadName.trim();
      mobile = fpoMobile.trim();
      email = fpoEmail.trim();
      password = fpoPassword;
      confirmPassword = fpoConfirmPassword;

      if (!organizationName) {
        setError("Please enter your FPO / Collective name.");
        return;
      }
      if (!contactPerson) {
        setError("Please enter the authorized representative's name.");
        return;
      }
      if (!mobile) {
        setError("Please enter the primary mobile number.");
        return;
      }
      if (!email) {
        setError("Please enter the official FPO email address.");
        return;
      }
    } else if (selectedRole === "buyer") {
      organizationName = buyerOrgName.trim();
      name = organizationName;
      contactPerson = buyerContactPerson.trim();
      mobile = buyerMobile.trim();
      email = buyerEmail.trim();
      password = buyerPassword;
      confirmPassword = buyerConfirmPassword;

      if (!organizationName) {
        setError("Please enter your Business / Organization name.");
        return;
      }
      if (!contactPerson) {
        setError("Please enter the primary procurement contact person.");
        return;
      }
      if (!mobile) {
        setError("Please enter your mobile number.");
        return;
      }
      if (!email) {
        setError("Please enter your business email address.");
        return;
      }
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setBusy(true);
    const registerError = await register({
      name,
      email: email || undefined,
      mobile: mobile || undefined,
      password,
      role: selectedRole,
      organizationName: organizationName || undefined,
      contactPerson: contactPerson || undefined,
    });
    setBusy(false);

    if (registerError) {
      setError(registerError);
      return;
    }

    // Direct user into role-specific onboarding
    nav("/onboarding");
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <Logo to="/" />
        <div>
          <span className="badge-pill badge-neutral" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", marginBottom: 16 }}>
            National Agri-Marketplace · SIH26132
          </span>
          <h2 style={{ fontSize: "28px", color: "#fff", marginBottom: "14px", lineHeight: 1.3 }}>
            Join India's AI-Powered Agricultural Decision & Linkage Network
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", maxWidth: "440px", lineHeight: 1.6 }}>
            Connect directly with verified institutional buyers, track real-time mandi prices across all Indian states, and receive trusted agronomic decisions.
          </p>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.9)", fontSize: 13.5 }}>
              <CheckCircle2 size={18} color="#85E0A3" />
              <span>Zero middlemen — direct farm-to-buyer transactions</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.9)", fontSize: 13.5 }}>
              <CheckCircle2 size={18} color="#85E0A3" />
              <span>AI Sell / Wait recommendations grounded in ICAR data</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.9)", fontSize: 13.5 }}>
              <CheckCircle2 size={18} color="#85E0A3" />
              <span>Multi-lingual voice assistant in 8+ Indian languages</span>
            </div>
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={16} />
          <span>Secure, Verified National Agriculture Infrastructure</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box" style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: "24px", marginBottom: "6px" }}>Create Your Account</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "18px" }}>
            Select your role to get started with KissanSetu AI.
          </p>

          {/* Role Selection Tabs */}
          <div className="role-tabs" style={{ marginBottom: 20 }}>
            <div
              className={`role-tab ${selectedRole === "farmer" ? "active" : ""}`}
              onClick={() => { setSelectedRole("farmer"); setError(null); }}
              role="button"
              tabIndex={0}
            >
              <Sprout size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
              Farmer
            </div>
            <div
              className={`role-tab ${selectedRole === "fpo" ? "active" : ""}`}
              onClick={() => { setSelectedRole("fpo"); setError(null); }}
              role="button"
              tabIndex={0}
            >
              <Building2 size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
              FPO Collective
            </div>
            <div
              className={`role-tab ${selectedRole === "buyer" ? "active" : ""}`}
              onClick={() => { setSelectedRole("buyer"); setError(null); }}
              role="button"
              tabIndex={0}
            >
              <Store size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "text-bottom" }} />
              Buyer / Enterprise
            </div>
          </div>

          <form onSubmit={onSubmit}>
            {/* Farmer Form */}
            {selectedRole === "farmer" && (
              <>
                <div className="field">
                  <label htmlFor="farmer-name">Full Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="farmer-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-mobile">Mobile Number <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="farmer-mobile"
                    type="tel"
                    value={farmerMobile}
                    onChange={(e) => setFarmerMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-email">Email Address <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 400 }}>(Optional)</span></label>
                  <input
                    id="farmer-email"
                    type="email"
                    value={farmerEmail}
                    onChange={(e) => setFarmerEmail(e.target.value)}
                    placeholder="e.g. farmer@example.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-pwd">Create Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="farmer-pwd"
                    type="password"
                    value={farmerPassword}
                    onChange={(e) => setFarmerPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-confirm-pwd">Confirm Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="farmer-confirm-pwd"
                    type="password"
                    value={farmerConfirmPassword}
                    onChange={(e) => setFarmerConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </>
            )}

            {/* FPO Form */}
            {selectedRole === "fpo" && (
              <>
                <div className="field">
                  <label htmlFor="fpo-name">FPO / Collective Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-name"
                    value={fpoName}
                    onChange={(e) => setFpoName(e.target.value)}
                    placeholder="e.g. Godavari Farmers Producer Co."
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-lead">Authorized Representative Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-lead"
                    value={fpoLeadName}
                    onChange={(e) => setFpoLeadName(e.target.value)}
                    placeholder="e.g. Suresh Deshmukh (Director / CEO)"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-mobile">Official Mobile Number <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-mobile"
                    type="tel"
                    value={fpoMobile}
                    onChange={(e) => setFpoMobile(e.target.value)}
                    placeholder="e.g. 9822011223"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-email">Official Email Address <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-email"
                    type="email"
                    value={fpoEmail}
                    onChange={(e) => setFpoEmail(e.target.value)}
                    placeholder="e.g. contact@godavarifpo.in"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-pwd">Create Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-pwd"
                    type="password"
                    value={fpoPassword}
                    onChange={(e) => setFpoPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-confirm-pwd">Confirm Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="fpo-confirm-pwd"
                    type="password"
                    value={fpoConfirmPassword}
                    onChange={(e) => setFpoConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </>
            )}

            {/* Buyer Form */}
            {selectedRole === "buyer" && (
              <>
                <div className="field">
                  <label htmlFor="buyer-org">Organization / Business Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-org"
                    value={buyerOrgName}
                    onChange={(e) => setBuyerOrgName(e.target.value)}
                    placeholder="e.g. FreshFarm Foods Ltd."
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-contact">Primary Contact Person <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-contact"
                    value={buyerContactPerson}
                    onChange={(e) => setBuyerContactPerson(e.target.value)}
                    placeholder="e.g. Anand Sharma (Procurement Head)"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-mobile">Contact Mobile Number <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-mobile"
                    type="tel"
                    value={buyerMobile}
                    onChange={(e) => setBuyerMobile(e.target.value)}
                    placeholder="e.g. 9988776655"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-email">Business Email Address <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e.g. procurement@freshfarmfoods.in"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-pwd">Create Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-pwd"
                    type="password"
                    value={buyerPassword}
                    onChange={(e) => setBuyerPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-confirm-pwd">Confirm Password <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    id="buyer-confirm-pwd"
                    type="password"
                    value={buyerConfirmPassword}
                    onChange={(e) => setBuyerConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  marginBottom: "14px",
                  border: "1px solid #FCA5A5",
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-block"
              disabled={busy}
              style={{ marginTop: 10, padding: "12px 18px", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {busy ? "Creating Account…" : (
                <>
                  <span>Create Account & Continue to Setup</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13.5px", color: "var(--ink-soft)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--green-deep)", fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
