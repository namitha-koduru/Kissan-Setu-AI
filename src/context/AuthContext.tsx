import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUsersWithCred } from "../data/demo";
import type { User, UserRole } from "../types";
import apiClient from "../services/api";

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

export function resolveFarmerId(user: User | null): number | null {
  if (!user || !user.id) return null;
  const rawId = String(user.id).trim();

  // If it's a direct positive integer
  const num = Number(rawId);
  if (!isNaN(num) && num > 0 && Number.isInteger(num)) {
    // If ID is a massive timestamp (> 1 billion), it is an invalid client timestamp ID
    if (num > 1000000000) return null;
    return num;
  }

  // Support demo fixtures "farmer-1", "farmer-2", etc.
  if (rawId.startsWith("farmer-")) {
    const parsed = parseInt(rawId.replace("farmer-", ""), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }
  if (rawId.startsWith("fpo-")) {
    const parsed = parseInt(rawId.replace("fpo-", ""), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1;
  }

  return null;
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

        // 3. Fallback to remote database authentication
        try {
          const authRes = await apiClient.post<any>("/auth/login", {
            username_or_phone: emailOrMobile,
            password: password,
            role: requestedRole,
          });
          if (authRes && authRes.user_id) {
            const profile = authRes.buyer || authRes.farmer || {};
            const resolvedRole: UserRole = (authRes.role || requestedRole || "farmer") as UserRole;
            const remoteUser: User = {
              id: authRes.user_id,
              name: profile.name || (resolvedRole === "buyer" ? "Registered Buyer" : "Registered User"),
              email: profile.email || cleanEmail || "",
              mobile: profile.phone || cleanMobile || "",
              role: resolvedRole,
              location: profile.location || (profile.district && profile.state ? `${profile.district}, ${profile.state}` : "Nashik, Maharashtra"),
              district: profile.district || "Nashik",
              state: profile.state || "Maharashtra",
              initials: ((profile.name || "KS").slice(0, 2)).toUpperCase(),
              organizationName: profile.organization || profile.organization_name,
              onboarded: true,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteUser));
            setUser(remoteUser);
            return null;
          }
        } catch (remoteErr) {
          console.warn("Backend auth verification failed:", remoteErr);
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
          `${normalizeMobile(input.mobile) || "farmer"}@kissansetu.in`;

        let backendUserId: string = "";
        try {
          if (input.role === "buyer") {
            const buyerRes = await apiClient.post<any>("/buyers", {
              name: input.organizationName || input.name.trim(),
              organization: input.organizationName || input.name.trim(),
              location: input.location || input.district || "Nashik, Maharashtra",
              phone: input.mobile?.trim(),
              email: primaryEmail,
              business_type: "Enterprise Buyer",
            });
            if (buyerRes && buyerRes.id) {
              backendUserId = String(buyerRes.id);
            } else {
              return "Failed to establish buyer profile with database. Please try again.";
            }
          } else {
            const farmerRes = await apiClient.post<any>("/farmers", {
              name: input.name.trim(),
              phone: input.mobile?.trim(),
              email: primaryEmail,
              role: input.role,
              organization_name: input.organizationName?.trim(),
              state: input.state || "Maharashtra",
              district: input.district || "Nashik",
            });
            if (farmerRes && farmerRes.id) {
              backendUserId = String(farmerRes.id);
            } else {
              return "Failed to establish farmer profile with database. Please try again.";
            }
          }
        } catch (apiErr: any) {
          const detailMsg =
            apiErr?.response?.data?.detail ||
            apiErr?.message ||
            "Could not connect to database to register profile. Please try again.";
          return detailMsg;
        }

        if (!backendUserId) {
          return "Your profile could not be registered in the database. Please try again.";
        }

        const createdUser: StoredUserWithCred = {
          id: backendUserId,
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
