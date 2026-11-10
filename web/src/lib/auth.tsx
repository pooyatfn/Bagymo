"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import type { User } from "@/lib/types";

const STORAGE_KEYS = ["access", "refresh", "user", "role"] as const;

interface AuthCtx {
  user: User | null;
  loading: boolean;
  /** Request an OTP code for a phone number. */
  login: (phone: string) => Promise<void>;
  verify: (phone: string, code: string) => Promise<{ created: boolean; user: User }>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

function storeSession(access: string, refresh: string, user: User) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", user.role);
}

function clearSession() {
  STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
}

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("access")) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get<User>("/auth/profile/");
      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        // token rejected → signed out
        clearSession();
        setUser(null);
      } else {
        // network/server hiccup → keep the cached profile so the panel still renders
        setUser(readCachedUser());
      }
    }
  }, []);

  useEffect(() => {
    // defer to a microtask so state updates happen outside the effect body
    Promise.resolve()
      .then(refreshUser)
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (phone: string) => {
    await api.post("/auth/otp-request/", { phone_number: phone });
  };

  const verify = async (phone: string, code: string) => {
    const res = await api.post("/auth/otp-verify/", { phone_number: phone, code });
    const { access, refresh, user: u, created } = res.data as { access: string; refresh: string; user: User; created: boolean };
    storeSession(access, refresh, u);
    setUser(u);
    return { created, user: u };
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.post("/auth/login-email/", { email, password });
    const { access, refresh, user: u } = res.data as { access: string; refresh: string; user: User };
    storeSession(access, refresh, u);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify, loginWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
