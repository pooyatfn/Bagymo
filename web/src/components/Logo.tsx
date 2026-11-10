import { cn } from "@/lib/cn";

/**
 * The bagymo mark: a lowercase "b" whose bowl is a coin with a check inside
 * (budget → confirmed booking). Same artwork as app/icon.svg (browser tab) and public/logo.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="باجیمو">
      <rect width="64" height="64" rx="16" className="fill-brand-600" />
      <rect width="64" height="64" rx="16" fill="url(#bagymo-mark)" />
      <defs>
        <linearGradient id="bagymo-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b98b" />
          <stop offset="1" stopColor="#04785e" />
        </linearGradient>
      </defs>
      <path d="M21 13v25" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" />
      <circle cx="33" cy="38" r="12" stroke="#fff" strokeWidth={7} fill="none" />
      <path d="M28.5 38.5l3.2 3.2 6-6.4" stroke="#a7f3da" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Brand mark + wordmark. */
export function Logo({ size = "md", className, light }: { size?: "sm" | "md"; className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("shrink-0 shadow-sm", size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl")} />
      <span className={cn("font-extrabold tracking-tight", size === "sm" ? "text-lg" : "text-xl", light ? "text-white" : "text-ink-900")}>
        باجیمو
      </span>
    </span>
  );
}
