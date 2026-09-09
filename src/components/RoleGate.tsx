import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import type { UserRole } from "../types";

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallbackPath?: string;
  blockedMessage?: string;
}

export function RoleGate({
  allowedRoles,
  children,
  fallbackPath,
  blockedMessage,
}: RoleGateProps) {
  const { user } = useAuth();
  const { showToast } = useAppState();

  const isAllowed = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isAllowed && user) {
      const msg =
        blockedMessage ||
        (user.role === "buyer"
          ? "Lot creation is available to Farmers and FPOs."
          : "You do not have permission to access this page.");
      showToast(msg);
    }
  }, [isAllowed, user, blockedMessage, showToast]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    const target =
      fallbackPath ||
      (user.role === "buyer"
        ? "/buyers"
        : user.role === "fpo"
        ? "/fpo"
        : "/dashboard");
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

export default RoleGate;
