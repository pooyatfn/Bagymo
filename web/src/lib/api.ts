/**
 * Axios instance for the bagymo API.
 * - attaches the JWT access token
 * - on 401 tries the refresh token once, then signs the user out
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_BASE}/api/auth/token/refresh/`, { refresh });
    const access = res.data?.access as string | undefined;
    if (!access) return null;
    localStorage.setItem("access", access);
    return access;
  } catch {
    return null;
  }
}

function clearSession() {
  ["access", "refresh", "role", "user"].forEach((k) => localStorage.removeItem(k));
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/") && !original.url.startsWith("/auth/profile");
    if (err.response?.status === 401 && typeof window !== "undefined" && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      clearSession();
    }
    return Promise.reject(err);
  },
);

export default api;
