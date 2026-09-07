import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sprout, Building2, Store, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { UserRole } from "../types";

export function RegisterPage() {
  const { user, register } = useAuth();
  const { t } = useLanguage();
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

  const [showPassword, setShowPassword] = useState(false);
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
        setError(t("common.error", "Please enter your full name."));
        return;
      }
      if (!mobile) {
        setError(t("common.error", "Please enter your mobile number for account verification."));
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
        setError(t("common.error", "Please enter your FPO / Collective name."));
        return;
      }
      if (!contactPerson) {
        setError(t("common.error", "Please enter the authorized representative's name."));
        return;
      }
      if (!mobile) {
        setError(t("common.error", "Please enter the primary mobile number."));
        return;
      }
      if (!email) {
        setError(t("common.error", "Please enter the official email address."));
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
        setError(t("common.error", "Please enter your Business / Organization name."));
        return;
      }
      if (!contactPerson) {
        setError(t("common.error", "Please enter the primary contact person's name."));
        return;
      }
      if (!mobile) {
        setError(t("common.error", "Please enter the business mobile number."));
        return;
      }
      if (!email) {
        setError(t("common.error", "Please enter the official business email."));
        return;
      }
    }

    if (!password || password.length < 6) {
      setError(t("common.error", "Password must be at least 6 characters long."));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("common.error", "Passwords do not match. Please re-enter carefully."));
      return;
    }

    // Auto-generate placeholder email if farmer leaves it blank
    const finalEmail = email || `farmer_${mobile}@kissansetu.in`;

    setBusy(true);
    const regError = await register({
      name,
      email: finalEmail,
      mobile,
      password,
      role: selectedRole,
      organizationName: organizationName || undefined,
      contactPerson: contactPerson || undefined,
    });
    setBusy(false);

    if (regError) {
      setError(regError);
    } else {
      // Direct newly registered user straight into tailored onboarding flow
      nav("/onboarding");
    }
  }

  const renderPasswordField = (
    id: string,
    label: string,
    value: string,
    setter: (val: string) => void,
    placeholder: string,
    isConfirm = false
  ) => (
    <div className="field">
      <label htmlFor={id}>
        {label} <span className="required">*</span>
      </label>
      <div className="password-wrapper">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          autoComplete={isConfirm ? "new-password" : "new-password"}
          required
        />
        {!isConfirm && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <Logo to="/" />
        <div>
          <h2>
            {t("landing.heroTitle", "Join India's AI-Powered Agricultural Intelligence Network")}
          </h2>
          <p>
            {t("landing.heroSubtitle", "Connect with verified institutional buyers, track real-time mandi prices across all Indian states, and receive trusted agronomic decisions.")}
          </p>
          <div className="auth-value-props">
            <div className="auth-value-prop">
              <CheckCircle2 size={18} />
              <span>{t("landing.directBuyerLink", "Zero middlemen — direct farm-to-buyer transactions")}</span>
            </div>
            <div className="auth-value-prop">
              <CheckCircle2 size={18} />
              <span>{t("landing.verifiedIntelligence", "AI Sell / Wait recommendations grounded in ICAR data")}</span>
            </div>
            <div className="auth-value-prop">
              <CheckCircle2 size={18} />
              <span>{t("landing.farmerAdvantage", "Multi-lingual voice assistant in 8+ Indian languages")}</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-footer">
          <ShieldCheck size={14} />
          <span>{t("nav.credit", "Secure, Verified National Agriculture Infrastructure")}</span>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <h2>{t("auth.registerTitle", "Create Your Account")}</h2>
          <p className="auth-subtitle">
            {t("auth.registerSubtitle", "Select your role to get started with KissanSetu AI.")}
          </p>

          {/* Role Selection */}
          <div className="role-tabs">
            <div
              className={`role-tab ${selectedRole === "farmer" ? "active" : ""}`}
              onClick={() => { setSelectedRole("farmer"); setError(null); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedRole("farmer")}
            >
              <Sprout size={16} />
              {t("auth.roleFarmer", "Farmer")}
            </div>
            <div
              className={`role-tab ${selectedRole === "fpo" ? "active" : ""}`}
              onClick={() => { setSelectedRole("fpo"); setError(null); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedRole("fpo")}
            >
              <Building2 size={16} />
              {t("auth.roleFpo", "FPO")}
            </div>
            <div
              className={`role-tab ${selectedRole === "buyer" ? "active" : ""}`}
              onClick={() => { setSelectedRole("buyer"); setError(null); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedRole("buyer")}
            >
              <Store size={16} />
              {t("auth.roleBuyer", "Buyer")}
            </div>
          </div>

          <form onSubmit={onSubmit}>
            {/* Farmer Form */}
            {selectedRole === "farmer" && (
              <>
                <div className="field">
                  <label htmlFor="farmer-name">{t("auth.fullName", "Full Name")} <span className="required">*</span></label>
                  <input
                    id="farmer-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-mobile">{t("auth.mobile", "Mobile Number")} <span className="required">*</span></label>
                  <input
                    id="farmer-mobile"
                    type="tel"
                    value={farmerMobile}
                    onChange={(e) => setFarmerMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="farmer-email">
                    {t("auth.email", "Email Address")} <span className="optional">(Optional)</span>
                  </label>
                  <input
                    id="farmer-email"
                    type="email"
                    value={farmerEmail}
                    onChange={(e) => setFarmerEmail(e.target.value)}
                    placeholder="e.g. farmer@example.com"
                    autoComplete="email"
                  />
                </div>
                {renderPasswordField("farmer-pwd", t("auth.password", "Create Password"), farmerPassword, setFarmerPassword, "Min 6 characters")}
                {renderPasswordField("farmer-confirm-pwd", t("auth.confirmPassword", "Confirm Password"), farmerConfirmPassword, setFarmerConfirmPassword, "Re-enter password", true)}
              </>
            )}

            {/* FPO Form */}
            {selectedRole === "fpo" && (
              <>
                <div className="field">
                  <label htmlFor="fpo-name">{t("auth.orgName", "FPO / Collective Name")} <span className="required">*</span></label>
                  <input
                    id="fpo-name"
                    value={fpoName}
                    onChange={(e) => setFpoName(e.target.value)}
                    placeholder="e.g. Godavari Farmers Producer Co."
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-lead">{t("auth.fullName", "Authorized Representative")} <span className="required">*</span></label>
                  <input
                    id="fpo-lead"
                    value={fpoLeadName}
                    onChange={(e) => setFpoLeadName(e.target.value)}
                    placeholder="e.g. Suresh Deshmukh (Director / CEO)"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-mobile">{t("auth.mobile", "Official Mobile Number")} <span className="required">*</span></label>
                  <input
                    id="fpo-mobile"
                    type="tel"
                    value={fpoMobile}
                    onChange={(e) => setFpoMobile(e.target.value)}
                    placeholder="e.g. 9822011223"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fpo-email">{t("auth.email", "Official Email Address")} <span className="required">*</span></label>
                  <input
                    id="fpo-email"
                    type="email"
                    value={fpoEmail}
                    onChange={(e) => setFpoEmail(e.target.value)}
                    placeholder="e.g. contact@godavarifpo.in"
                    autoComplete="email"
                    required
                  />
                </div>
                {renderPasswordField("fpo-pwd", t("auth.password", "Create Password"), fpoPassword, setFpoPassword, "Min 6 characters")}
                {renderPasswordField("fpo-confirm-pwd", t("auth.confirmPassword", "Confirm Password"), fpoConfirmPassword, setFpoConfirmPassword, "Re-enter password", true)}
              </>
            )}

            {/* Buyer Form */}
            {selectedRole === "buyer" && (
              <>
                <div className="field">
                  <label htmlFor="buyer-org">{t("auth.orgName", "Organization / Business Name")} <span className="required">*</span></label>
                  <input
                    id="buyer-org"
                    value={buyerOrgName}
                    onChange={(e) => setBuyerOrgName(e.target.value)}
                    placeholder="e.g. FreshFarm Foods Ltd."
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-contact">{t("auth.fullName", "Primary Contact Person")} <span className="required">*</span></label>
                  <input
                    id="buyer-contact"
                    value={buyerContactPerson}
                    onChange={(e) => setBuyerContactPerson(e.target.value)}
                    placeholder="e.g. Anand Sharma (Procurement Head)"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-mobile">{t("auth.mobile", "Contact Mobile Number")} <span className="required">*</span></label>
                  <input
                    id="buyer-mobile"
                    type="tel"
                    value={buyerMobile}
                    onChange={(e) => setBuyerMobile(e.target.value)}
                    placeholder="e.g. 9988776655"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="buyer-email">{t("auth.email", "Business Email Address")} <span className="required">*</span></label>
                  <input
                    id="buyer-email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e.g. procurement@freshfarmfoods.in"
                    autoComplete="email"
                    required
                  />
                </div>
                {renderPasswordField("buyer-pwd", t("auth.password", "Create Password"), buyerPassword, setBuyerPassword, "Min 6 characters")}
                {renderPasswordField("buyer-confirm-pwd", t("auth.confirmPassword", "Confirm Password"), buyerConfirmPassword, setBuyerConfirmPassword, "Re-enter password", true)}
              </>
            )}

            {error && (
              <div className="form-error-alert">
                {error}
              </div>
            )}

            <button
              className={`btn btn-primary btn-block btn-lg ${busy ? "btn-loading" : ""}`}
              disabled={busy}
            >
              {busy ? t("common.loading", "Creating Account…") : (
                <>
                  <span>{t("auth.registerButton", "Create Account & Continue")}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-link">
            {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
            <Link to="/login">{t("auth.loginButton", "Sign In")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
