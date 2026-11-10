import Link from "next/link";
import type { VenueLite } from "@/lib/usePublicData";
import { Badge } from "@/components/ui";
import { MapPinIcon, StarIconSolid } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatNumber, formatTomans } from "@/lib/format";

/** Public venue card (landing showcase + /venues list). */
export function VenueCard({ v }: { v: VenueLite }) {
  const cat = categoryMeta(v.category_slug, v.category_name);
  const body = (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6", cat.tint)}>{cat.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink-900 group-hover:text-brand-800">{v.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
            <MapPinIcon className="h-3.5 w-3.5" /> {[v.district, v.city === "Tehran" ? "تهران" : v.city].filter(Boolean).join("، ")}
          </p>
        </div>
        {v.avg_rating != null && (
          <span className="flex items-center gap-1 text-xs font-medium text-ink-700">
            <StarIconSolid className="h-3.5 w-3.5 text-amber-400" /> {formatNumber(v.avg_rating)}
          </span>
        )}
      </div>
      {v.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-500">{v.description}</p>}
      <div className="min-h-4 flex-1" />
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Badge size="sm">{cat.label}</Badge>
        {v.offers?.[0] && (
          <span className="text-xs text-ink-500">
            از <b className="tabular text-sm text-ink-900">{formatTomans(Math.min(...v.offers.map((o) => o.price)))}</b>
          </span>
        )}
      </div>
    </div>
  );
  return (
    <Link href={`/venues/${v.id}`} className="group">
      {body}
    </Link>
  );
}
