"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface User {
  id: number;
  phone_number: string;
  name: string;
  role: string;
  remaining_budget: number;
  annual_budget: number;
  sheba?: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (phone: string) => Promise<void>;
  verify: (phone: string, code: string) => Promise<{ created: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) { setUser(null); return; }
      const res = await api.get("/auth/profile/");
      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchUser = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!token) {
      Promise.resolve()
        .then(() => {
          setUser(null);
          setLoading(false);
        });
      return;
    }
    api
      .get("/auth/profile/")
      .then((res) => {
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        const raw = localStorage.getItem("user");
        if (raw) {
          const cached: User = JSON.parse(raw);
          if (["user", "company_admin", "company_hr", "venue_staff", "admin"].includes(cached.role)) {
            setUser(cached);
          } else {
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("role");
          }
        } else {
          setUser(null);
          // redirect to login for protected routes (but not on landing or login pages)
          if (typeof window !== "undefined") {
            const publicPaths = ["/", "/login"];
            if (!publicPaths.includes(window.location.pathname)) {
              window.location.href = "/login";
            }
          }
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (phone: string) => {
    await api.post("/auth/otp-request/", { phone_number: phone });
  };

  const verify = async (phone: string, code: string) => {
    const res = await api.post("/auth/otp-verify/", { phone_number: phone, code });
    const { access, refresh, user: u } = res.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("role", u.role);
    setUser(u);
    return { created: res.data.created };
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.post("/auth/login-email/", { email, password });
    const { access, refresh, user: u } = res.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("role", u.role);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify, loginWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
