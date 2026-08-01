import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function Bars3Icon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
export function XMarkIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
export function SparklesIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.2 6.6h6.6l-5.3 3.8 2 6.4-5.5-3.7-5.5 3.7 2-6.4-5.3-3.8h6.6z" />
    </svg>
  );
}
export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
export function MapPinIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5c0 6-9 13-9 13s-9-7-9-13a9 9 0 1118 0z" />
      <circle cx="12" cy="10.5" r="3" />
    </svg>
  );
}
export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}
export function StarIconSolid({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.184-3.672-7.184 3.672 1.48-8.279-6.064-5.828 8.332-1.151z" />
    </svg>
  );
}
export function BuildingIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10.4l8-4 8 4V20M4 20v-6h16v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h8v6H8z" />
    </svg>
  );
}
export function UserGroupIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-5.5a3.5 3.5 0 00-3.5-3.5h-3.5A3.5 3.5 0 017 14.5V20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4a3 3 0 11-6 0 3 3 0 016 0zM15 4a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
export function WalletIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h8v2H8z" />
    </svg>
  );
}
export function ChartBarIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17v-2h4v2m0 0V7a4 4 0 014 0v10m0 0h4v2m0 0v-6h-4v6z" />
    </svg>
  );
}
export function QrIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="16" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="16" width="5" height="5" rx="1" />
      <rect x="16" y="16" width="5" height="5" rx="1" />
    </svg>
  );
}
export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}
export function DumbbellIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6M6 15l6-6 6 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 012-2h2.59l1.7 1.7A2 2 0 0011 8h2a2 2 0 00.71-1.29L15.41 5H17a2 2 0 012 2v7.59l.29 1.71A2 2 0 0119 17h-2.59l-1.7-1.7A2 2 0 0014 15h-2a2 2 0 00-.71 1.29L10.59 19H9a2 2 0 01-2-2V8z" />
    </svg>
  );
}
export function PoolIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="10" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V4a2 2 0 012-2h6a2 2 0 012 2v3M7 17h10" />
    </svg>
  );
}
export function FilmIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h1l3 3 3-3h1v8H8z" />
      <circle cx="7" cy="18" r="1" />
      <circle cx="17" cy="18" r="1" />
    </svg>
  );
}
export function YogaIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a4 4 0 00-4-4 4 4 0 008 0 4 4 0 00-4 4zm-4-7a4 4 0 118 0H8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v5m4-7l-2 2m-4-2l2 2" />
    </svg>
  );
}
export function BallIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H8a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M8 12h8m0 0l-3-3m3 3l-3 3" />
    </svg>
  );
}
