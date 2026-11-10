import { ReactNode } from "react";
import { BallIcon, DumbbellIcon, FilmIcon, PoolIcon, SparklesIcon, YogaIcon } from "@/components/icons";

interface CategoryMeta {
  label: string;
  icon: ReactNode;
  /** Tailwind classes for the tinted icon tile. */
  tint: string;
}

const META: Record<string, CategoryMeta> = {
  gym: { label: "بدنسازی", icon: <DumbbellIcon />, tint: "bg-brand-50 text-brand-700" },
  pool: { label: "استخر", icon: <PoolIcon />, tint: "bg-sky-50 text-sky-700" },
  cinema: { label: "سینما", icon: <FilmIcon />, tint: "bg-violet-50 text-violet-700" },
  yoga: { label: "یوگا", icon: <YogaIcon />, tint: "bg-rose-50 text-rose-700" },
  sport: { label: "مجموعه ورزشی", icon: <BallIcon />, tint: "bg-amber-50 text-amber-700" },
};

const FALLBACK: CategoryMeta = { label: "تفریحی", icon: <SparklesIcon />, tint: "bg-gray-100 text-ink-700" };

export function categoryMeta(slug?: string | null, name?: string | null): CategoryMeta {
  const m = (slug && META[slug]) || FALLBACK;
  return name && !(slug && META[slug]) ? { ...m, label: name } : m;
}

export const CATEGORY_OPTIONS = Object.entries(META).map(([slug, m]) => ({ slug, label: m.label }));
