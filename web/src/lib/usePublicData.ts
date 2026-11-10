import { useApi } from "@/lib/useApi";

export interface VenueLite {
  id: number;
  name: string;
  category_name: string;
  category_slug: string;
  district: string;
  city: string;
  address?: string;
  lat?: number;
  lng?: number;
  gender_policy?: string;
  description?: string;
  avg_rating?: number | null;
  rating_count: number;
  offers?: Array<{ name: string; price: number; duration_minutes: number }>;
}

export interface CategoryLite {
  id: number;
  slug: string;
  name_en: string;
  name_fa: string;
  icon_class: string;
}

export function usePublicCategories() {
  return useApi<CategoryLite[]>("/catalog/categories/");
}

/** Active venues only (the API never returns pending or suspended ones to the public). */
export function usePublicVenues() {
  return useApi<VenueLite[]>("/catalog/venues/");
}
