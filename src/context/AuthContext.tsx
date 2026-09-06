import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUsers } from "../data/demo";
import type { User, UserRole } from "../types";

export interface RegisterInput {
  name: string;
  email?: string;
  mobile?: string;
  password: string;
  role: UserRole;
  organizationName?: string;
  contactPerson?: string;
  location?: string;
  district?: string;
  state?: string;
}

interface StoredUserWithCred extends User {
  passwordHash?: string;
  registeredPassword?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string) => Promise<string | null>;
  register: (input: RegisterInput) => Promise<string | null>;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "kisansetu-user";
const REGISTERED_USERS_KEY = "kisansetu-registered-users";

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function readRegisteredUsers(): StoredUserWithCred[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUserWithCred[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStored());
  const [loading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(emailOrMobile, password) {
        if (!emailOrMobile?.trim() || !password?.trim()) {
          return "Please provide both email/mobile and password.";
        }
        const cleanIdentifier = emailOrMobile.trim().toLowerCase();
        const cleanDigits = emailOrMobile.replace(/\D/g, "");
        const registered = readRegisteredUsers();
        
        // 1. Check registered users first
        const registeredMatch = registered.find((u) => {
          const matchEmail = u.email && u.email.toLowerCase() === cleanIdentifier;
          const userDigits = u.mobile ? u.mobile.replace(/\D/g, "") : "";
          const matchMobile = cleanDigits && userDigits && (userDigits === cleanDigits || userDigits.endsWith(cleanDigits) || cleanDigits.endsWith(userDigits));
          return matchEmail || matchMobile;
        });

        if (registeredMatch) {
          if (registeredMatch.registeredPassword && registeredMatch.registeredPassword !== password) {
            return "Invalid credentials. Please verify your password.";
          }
          const safeUser: User = { ...registeredMatch };
          delete (safeUser as any).passwordHash;
          delete (safeUser as any).registeredPassword;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
          setUser(safeUser);
          return null;
        }

        // 2. Check demo users fixture (for SIH evaluations/tests)
        const demoMatch = demoUsers.find((u) => {
          const matchEmail = u.email?.toLowerCase() === cleanIdentifier;
          const userDigits = u.mobile ? u.mobile.replace(/\D/g, "") : "";
          const matchMobile = cleanDigits && userDigits && (userDigits === cleanDigits || userDigits.endsWith(cleanDigits) || cleanDigits.endsWith(userDigits));
          return matchEmail || matchMobile;
        });

        if (demoMatch) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demoMatch));
          setUser(demoMatch);
          return null;
        }

        return "Invalid credentials. Please verify your email/mobile and password.";
      },
      async register(input) {
        const initials = input.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "KS";

        const primaryEmail = input.email?.trim() || `${input.mobile?.replace(/\D/g, "") || Date.now()}@kisansetu.in`;
        
        const createdUser: StoredUserWithCred = {
          id: `u-${Date.now()}`,
          name: input.name.trim(),
          email: primaryEmail,
          role: input.role,
          location: input.location || "",
          district: input.district || "",
          state: input.state || "",
          initials,
          mobile: input.mobile?.trim(),
          organizationName: input.organizationName?.trim(),
          contactPerson: input.contactPerson?.trim(),
          registeredPassword: input.password,
          verificationStatus: input.role === "buyer" ? "UNVERIFIED" : "VERIFIED",
          onboarded: false,
        };

        const currentRegistered = readRegisteredUsers();
        const updated = [
          ...currentRegistered.filter(
            (u) =>
              (input.email && u.email?.toLowerCase() !== input.email.toLowerCase()) ||
              (input.mobile && u.mobile?.replace(/\D/g, "") !== input.mobile.replace(/\D/g, ""))
          ),
          createdUser,
        ];
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));

        const safeUser: User = { ...createdUser };
        delete (safeUser as any).passwordHash;
        delete (safeUser as any).registeredPassword;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
        return null;
      },
      updateUserProfile(updates: Partial<User>) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated: User = { ...prev, ...updates };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          // Also update in registered list
          const currentRegistered = readRegisteredUsers();
          const listUpdated = currentRegistered.map((u) => {
            if (u.id === prev.id || (prev.email && u.email?.toLowerCase() === prev.email.toLowerCase())) {
              return { ...u, ...updates };
            }
            return u;
          });
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(listUpdated));

          return updated;
        });
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
