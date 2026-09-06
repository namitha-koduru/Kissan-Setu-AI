import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MobileNav, Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Navbar";

export function AppLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      {open && (
        <>
          <button className="drawer-overlay" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="drawer">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
      <div className="app-main">
        <Topbar onMenu={() => setOpen(true)} />
        <Outlet />
        <MobileNav />
      </div>
    </div>
  );
}
