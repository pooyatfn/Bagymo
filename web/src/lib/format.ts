/** Persian (fa-IR) formatting helpers. All amounts are in Toman. */

const nf = new Intl.NumberFormat("fa-IR");

export function formatNumber(n: number | undefined | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  return nf.format(Number(n));
}

export function formatTomans(n: number | undefined | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  return `${nf.format(Number(n))} تومان`;
}

/** Short form for tight spaces: ۱٫۲ میلیون تومان, ۸۵۰ هزار تومان. */
export function formatTomansShort(n: number | undefined | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  const abs = Math.abs(v);
  const short = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
  if (abs >= 1_000_000_000) return `${short.format(v / 1_000_000_000)} میلیارد تومان`;
  if (abs >= 1_000_000) return `${short.format(v / 1_000_000)} میلیون تومان`;
  if (abs >= 10_000) return `${short.format(v / 1_000)} هزار تومان`;
  return formatTomans(v);
}

export function formatPercent(n: number | undefined | null, digits = 0): string {
  if (n == null || isNaN(Number(n))) return "—";
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits }).format(Number(n))}٪`;
}

export function formatDate(
  d: string | Date | undefined | null,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fa-IR", opts);
}

export function formatDateTime(d: string | Date | undefined | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return `${formatDate(date)} · ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "14:30:00" → "۱۴:۳۰" */
export function formatClock(t: string | undefined | null): string {
  if (!t) return "—";
  return persianNumbers(t.slice(0, 5));
}

/** Human "time ago" in Persian, e.g. «۳ ساعت پیش». */
export function timeAgo(d: string | Date | undefined | null): string {
  if (!d) return "—";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (isNaN(diff)) return "—";
  if (diff < 60) return "همین الان";
  if (diff < 3600) return `${formatNumber(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${formatNumber(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 86400 * 30) return `${formatNumber(Math.floor(diff / 86400))} روز پیش`;
  return formatDate(d);
}

export function timeLeft(expiresAt: string | undefined | null): string {
  if (!expiresAt) return "—";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (isNaN(diff)) return "—";
  if (diff <= 0) return "منقضی شده";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${formatNumber(mins)} دقیقه باقی‌مانده`;
  return `${formatNumber(Math.floor(mins / 60))} ساعت و ${formatNumber(mins % 60)} دقیقه باقی‌مانده`;
}

export function persianNumbers(input: string | number): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(input).replace(/[0-9]/g, (d) => fa[Number(d)]);
}

/** Convert Persian/Arabic digits typed by users to ASCII (for API payloads). */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export const GENDER_LABELS: Record<string, string> = {
  mixed: "مختلط",
  male: "آقایان",
  female: "بانوان",
};
