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
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (phone: string) => Promise<void>;
  verify: (phone: string, code: string) => Promise<{ created: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      // use the stored access token to get user info
      const token = localStorage.getItem("access");
      if (!token) { setUser(null); setLoading(false); return; }
      // The user data is embedded in the login response; re-fetch from /auth/token/ if needed
      // For now, re-login via stored token is not an endpoint. We store user in localStorage too.
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch { setUser(null); }
    setLoading(false);
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

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
