import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import notFoundImg from "../assets/404-illustration.jpg";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Determine home destination based on role
  const homePath = user
    ? user.role === "fpo"
      ? "/fpo"
      : user.role === "buyer"
      ? "/buyers"
      : "/dashboard"
    : "/";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9FBF8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px 50px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <Logo to={homePath} size={36} />
      </div>

      {/* Main 404 Card / Illustration Container */}
      <div
        style={{
          maxWidth: 720,
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(23, 107, 69, 0.08)",
          border: "1px solid #E8EFE9",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div style={{ maxHeight: 380, overflow: "hidden", background: "#F5F8F5" }}>
          <img
            src={notFoundImg}
            alt="404 Page Not Found - Wandered off the field"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 380,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        <div style={{ padding: "30px 24px 36px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--green-deep, #176B45)",
              marginBottom: 6,
            }}
          >
            404 ERROR
          </div>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--navy, #0B2545)",
              margin: "0 0 10px",
            }}
          >
            {t("common.pageNotFound", "Page Not Found")}
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "var(--ink-soft, #5A6A80)",
              maxWidth: 480,
              margin: "0 auto 26px",
              lineHeight: 1.5,
            }}
          >
            {t(
              "common.wanderedOffField",
              "Looks like you've wandered off the field. The page you're looking for doesn't exist or has been moved.",
            )}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Link
              to={homePath}
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 12,
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                background: "var(--green-deep, #176B45)",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(23, 107, 69, 0.25)",
              }}
            >
              <Home size={16} />
              <span>{t("common.goToHome", "Go to Home")}</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                borderRadius: 12,
                fontSize: "14px",
                fontWeight: 700,
                background: "#FFFFFF",
                border: "1.5px solid #D5E2D8",
                color: "var(--navy, #0B2545)",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              <span>{t("common.goBack", "Go Back")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div
        style={{
          marginTop: 24,
          fontSize: "12.5px",
          color: "var(--ink-muted, #8E9BAE)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>🌾 KissanSetu AI · Bridging Farmers to Opportunities</span>
      </div>
    </div>
  );
}

export default NotFoundPage;
