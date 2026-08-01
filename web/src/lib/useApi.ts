import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

export type ApiStatus = "idle" | "loading" | "success" | "error";

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: ApiStatus;
  refetch: () => Promise<T | undefined>;
}

function unwrapPayload(res: { data: unknown }): unknown {
  const d = res.data;
  if (d && typeof d === "object" && Array.isArray((d as { results?: unknown }).results)) {
    return (d as { results: unknown[] }).results;
  }
  if (Array.isArray(d)) {
    return d;
  }
  return d;
}

const { toString } = Object.prototype;
function isAxiosError(e: unknown): e is { response?: { data?: { detail?: string } } } {
  return toString.call(e) === "[object Object]";
}

export function useApi<T = unknown>(url: string | null | false): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ApiStatus>(url ? "loading" : "idle");
  const [error, setError] = useState<Error | null>(null);
  const abortedRef = useRef<boolean>(false);

  const doFetch = useCallback((): Promise<T | undefined> => {
    if (!url) {
      return Promise.resolve(undefined);
    }
    abortedRef.current = false;
    return api
      .get(url as string)
      .then((res) => {
        if (abortedRef.current) return undefined;
        const payload = unwrapPayload(res) as T;
        setData(payload);
        setStatus("success");
        return payload;
      })
      .catch((e: unknown) => {
        if (abortedRef.current) return undefined;
        const err = e instanceof Error ? e : new Error(isAxiosError(e) ? String(e.response?.data?.detail) : String(e));
        setError(err);
        setData(null);
        setStatus("error");
        return undefined;
      });
  }, [url]);

  useEffect(() => {
    if (!url) return;
    abortedRef.current = false;
    void doFetch();
    return () => {
      abortedRef.current = true;
    };
  }, [url, doFetch]);

  const refetch = useCallback(() => {
    if (!url) return Promise.resolve(undefined);
    setStatus("loading");
    setError(null);
    abortedRef.current = false;
    return doFetch();
  }, [doFetch, url]);

  return {
    data,
    loading: status === "loading",
    error,
    status,
    refetch,
  };
}
