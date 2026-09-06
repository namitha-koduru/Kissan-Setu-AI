import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MobileNav, Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Navbar";
import { ToastContainer } from "../components/Toast";
import { Logo } from "../components/Logo";

export function AppLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />

      {/* Mobile slide-out drawer */}
      {menuOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />
          <div className="drawer-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Logo to="/dashboard" />
              <button
                className="icon-btn"
                type="button"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </>
      )}

      <div className="app-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
        <MobileNav />
        <ToastContainer />
      </div>
    </div>
  );
}
