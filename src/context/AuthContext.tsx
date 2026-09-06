import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoPassword, demoUsers } from "../data/demo";
import type { User, UserRole } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    location: string;
  }) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "kisansetu-user";

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStored());
  const [loading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const found = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found || password !== demoPassword) {
          return "Use a demo account. Password for all demo users is demo123.";
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        setUser(found);
        return null;
      },
      async register(input) {
        const created: User = {
          id: `u-${Date.now()}`,
          name: input.name,
          email: input.email,
          role: input.role,
          location: input.location,
          district: input.location.split(",")[0]?.trim() || "Nashik",
          state: "Maharashtra",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
        setUser(created);
        return null;
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
