/**
 * Lazy-load Leaflet from the bundled npm package (client-only).
 * Leaflet touches `window` on import, so it must never load during SSR.
 * Its CSS is imported once in app/globals.css.
 */
import type * as Leaflet from "leaflet";

export type { Map as LMap, Marker as LMarker } from "leaflet";

let promise: Promise<typeof Leaflet> | null = null;

export function loadLeaflet(): Promise<typeof Leaflet> {
  promise ??= import("leaflet").then((m) => (m.default ?? m) as typeof Leaflet);
  return promise;
}

export const TEHRAN: [number, number] = [35.6892, 51.389];
export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = "&copy; OpenStreetMap";

/** Round pin used for markers (keeps us independent of Leaflet's image assets). */
export function pinHtml(color: string, label = "", size = 30): string {
  return `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid #fff;border-radius:9999px;box-shadow:0 4px 10px rgba(16,24,40,.25);display:flex;align-items:center;justify-content:center;color:#fff;font:600 12px Vazirmatn,sans-serif">${label}</div>`;
}
