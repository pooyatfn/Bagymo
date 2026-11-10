/**
 * Outline icon set (24px grid, 1.75 stroke). Every icon accepts the normal
 * SVG props; size defaults to h-5 w-5 and color follows `currentColor`.
 */
import { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

function Icon({ className, children, ...props }: IconProps) {
  return (
    <svg
      className={className || "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- navigation & chrome ---------- */
export const Bars3Icon = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);
export const XMarkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const HomeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-6h4v6h5V9.5" /></Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>
);
export const TicketIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></Icon>
);
export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></Icon>
);
export const UserIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
);
export const UserGroupIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></Icon>
);
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17 5 12l5-5M5 12h11" /></Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>
);
export const ExternalLinkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></Icon>
);

/* ---------- actions ---------- */
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
);
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4" /></Icon>
);
export const CogIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
);

/* ---------- feedback ---------- */
export const CheckCircleIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></Icon>
);
export const AlertTriangleIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></Icon>
);
export const InfoIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>
);
export const InboxIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></Icon>
);

/* ---------- domain ---------- */
export const SparklesIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9z" /><path d="M19 3v3M17.5 4.5h3M5 17v3M3.5 18.5h3" /></Icon>
);
export const MapPinIcon = (p: IconProps) => (
  <Icon {...p}><path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0z" /><circle cx="12" cy="10" r="2.5" /></Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export function StarIconSolid({ className, ...props }: IconProps) {
  return (
    <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
    </svg>
  );
}
export const BuildingIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18" /><path d="M8 7h4M8 11h4M8 15h4" /></Icon>
);
export const StoreIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 9.5V20h16V9.5M3 9l1.5-5h15L21 9a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M10 20v-5h4v5" /></Icon>
);
export const WalletIcon = (p: IconProps) => (
  <Icon {...p}><path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" /><path d="M16.5 14h.01" /></Icon>
);
export const BanknotesIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v.01M18 14.5v.01" /></Icon>
);
export const ChartBarIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>
);
export const TrendingUpIcon = (p: IconProps) => (
  <Icon {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Icon>
);
export const QrIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></Icon>
);
export const ShieldCheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 21s8-3.5 8-10V5l-8-3-8 3v6c0 6.5 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const TagIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.5" /></Icon>
);

/* ---------- categories ---------- */
export const DumbbellIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></Icon>
);
export const PoolIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2 18c1.7 0 1.7 1 3.3 1s1.7-1 3.4-1 1.6 1 3.3 1 1.7-1 3.3-1 1.7 1 3.4 1 1.6-1 3.3-1" /><path d="M8 15V5a2 2 0 0 1 4 0M16 15V5a2 2 0 0 0-4 0M8 9h8M8 13h8" /></Icon>
);
export const FilmIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></Icon>
);
export const YogaIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="4.5" r="2" /><path d="M12 7.5v6M6 10.5l6 3 6-3M8 20l4-6.5 4 6.5M5 20h14" /></Icon>
);
export const BallIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3a14 14 0 0 1 0 18M3.5 9h17M3.5 15h17" /></Icon>
);
