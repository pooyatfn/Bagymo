export function formatTomans(n: number | undefined | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("fa-IR").format(Number(n)) + " تومان";
}

export function formatDate(
  d: string | Date | undefined | null,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fa-IR", opts);
  } catch {
    return "—";
  }
}

export function formatDateTime(d: string | Date | undefined | null): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return (
      date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) +
      " ساعت " +
      date.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  } catch {
    return "—";
  }
}

export function timeLeft(expiresAt: string | undefined | null): string {
  if (!expiresAt) return "—";
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return "منقضی شده";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} دقیقه باقیمانده`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} ساعت و ${mins % 60} دقیقه باقیمانده`;
}

export function persianNumbers(input: string | number): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return String(input).replace(/[0-9]/g, (d) => fa[Number(d)]);
}
