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
          <div
            className="drawer-overlay"
            onClick={() => setMenuOpen(false)}
            role="presentation"
          />
          <div className="drawer-panel" role="dialog" aria-label="Navigation menu">
            <div className="flex flex-between flex-center mb-lg">
              <Logo to="/dashboard" />
              <button
                className="icon-btn"
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
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
        <main className="main-content" id="main-content">
          <Outlet />
        </main>
        <MobileNav />
        <ToastContainer />
      </div>
    </div>
  );
}
