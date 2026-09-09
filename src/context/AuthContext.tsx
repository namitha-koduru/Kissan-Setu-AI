import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUsersWithCred } from "../data/demo";
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
  login: (emailOrMobile: string, password: string, requestedRole?: UserRole) => Promise<string | null>;
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

export function normalizeMobile(mobile?: string): string {
  if (!mobile) return "";
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function normalizeEmail(email?: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function readRegisteredUsers(): StoredUserWithCred[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUserWithCred[]) : [];
  } catch {
    return [];
  }
}

export function checkAccountAvailability(
  mobile?: string,
  email?: string,
): { available: boolean; error?: string } {
  const normMobile = normalizeMobile(mobile);
  const normEmail = normalizeEmail(email);
  const registered = readRegisteredUsers();

  // 1. Mobile Uniqueness across ALL accounts & roles (Farmers, FPOs, Buyers)
  if (normMobile && normMobile.length >= 10) {
    const mobileExistsInRegistered = registered.some((u) => {
      const uMobile = normalizeMobile(u.mobile);
      return uMobile && uMobile === normMobile;
    });

    const mobileExistsInDemo = demoUsersWithCred.some((u) => {
      const uMobile = normalizeMobile(u.mobile);
      return uMobile && uMobile === normMobile;
    });

    if (mobileExistsInRegistered || mobileExistsInDemo) {
      return {
        available: false,
        error: "This mobile number is already registered. Please log in or use a different number.",
      };
    }
  }

  // 2. Email Uniqueness across ALL accounts & roles
  if (normEmail) {
    const emailExistsInRegistered = registered.some((u) => {
      const uEmail = normalizeEmail(u.email);
      return uEmail && uEmail === normEmail;
    });

    const emailExistsInDemo = demoUsersWithCred.some((u) => {
      const uEmail = normalizeEmail(u.email);
      return uEmail && uEmail === normEmail;
    });

    if (emailExistsInRegistered || emailExistsInDemo) {
      return {
        available: false,
        error: "This email is already registered. Please log in or use a different email.",
      };
    }
  }

  return { available: true };
}

function roleToTitle(role: UserRole | string): string {
  if (role === "farmer") return "Farmer";
  if (role === "fpo") return "FPO";
  if (role === "buyer") return "Buyer";
  if (role === "admin") return "Admin";
  return String(role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStored());
  const [loading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(emailOrMobile, password, requestedRole) {
        if (!emailOrMobile?.trim() || !password?.trim()) {
          return "Please provide both email/mobile and password.";
        }
        const cleanEmail = normalizeEmail(emailOrMobile);
        const cleanMobile = normalizeMobile(emailOrMobile);
        const registered = readRegisteredUsers();

        // 1. Check registered users first
        const registeredMatch = registered.find((u) => {
          const matchEmail = cleanEmail && normalizeEmail(u.email) === cleanEmail;
          const matchMobile = cleanMobile && normalizeMobile(u.mobile) === cleanMobile;
          return matchEmail || matchMobile;
        });

        if (registeredMatch) {
          if (
            registeredMatch.registeredPassword &&
            registeredMatch.registeredPassword !== password
          ) {
            return "Invalid credentials. Please verify your password.";
          }

          // Strict Role Validation
          if (requestedRole && registeredMatch.role !== requestedRole) {
            return `These credentials belong to a ${roleToTitle(
              registeredMatch.role,
            )} account. Please use ${roleToTitle(registeredMatch.role)} Login.`;
          }

          const safeUser: User = { ...registeredMatch };
          delete (safeUser as any).passwordHash;
          delete (safeUser as any).registeredPassword;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
          setUser(safeUser);
          return null;
        }

        // 2. Check 15 sample demo users
        const demoMatch = demoUsersWithCred.find((u) => {
          const matchEmail = cleanEmail && normalizeEmail(u.email) === cleanEmail;
          const matchMobile = cleanMobile && normalizeMobile(u.mobile) === cleanMobile;
          return matchEmail || matchMobile;
        });

        if (demoMatch) {
          if (demoMatch.password !== password) {
            return "Invalid credentials. Please verify your password.";
          }

          // Strict Role Validation
          if (requestedRole && demoMatch.role !== requestedRole) {
            return `These credentials belong to a ${roleToTitle(
              demoMatch.role,
            )} account. Please use ${roleToTitle(demoMatch.role)} Login.`;
          }

          const { password: _p, ...safeUser } = demoMatch;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
          setUser(safeUser);
          return null;
        }

        return "Invalid credentials. Please verify your email/mobile and password.";
      },
      async register(input) {
        // Enforce global uniqueness across ALL roles & existing accounts
        const availability = checkAccountAvailability(input.mobile, input.email);
        if (!availability.available && availability.error) {
          return availability.error;
        }

        const initials =
          input.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "KS";

        const primaryEmail =
          input.email?.trim() ||
          `${normalizeMobile(input.mobile) || Date.now()}@kissansetu.in`;

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
        // Append new user safely without overwriting other accounts
        const updated = [...currentRegistered, createdUser];
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
            if (
              u.id === prev.id ||
              (prev.email && u.email?.toLowerCase() === prev.email.toLowerCase())
            ) {
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
