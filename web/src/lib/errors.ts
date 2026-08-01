export function apiErrorDetail(err: unknown, fallback = "خطا در انجام درخواست"): string {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail || fallback;
}
