/** Extract a human-readable message from an API error (DRF `detail` or first field error). */
export function apiErrorDetail(err: unknown, fallback = "خطا در انجام درخواست"): string {
  const e = err as { response?: { data?: unknown }; code?: string };
  if (e?.code === "ERR_NETWORK") return "ارتباط با سرور برقرار نشد.";
  const data = e?.response?.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    const first = Object.values(d)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return fallback;
}
