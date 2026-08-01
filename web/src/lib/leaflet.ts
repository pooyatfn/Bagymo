// Minimal, type-safe shims for the Leaflet object loaded from CDN at runtime.
// We do NOT import the `leaflet` package (to keep the existing CDN-loading +
// SSR-safe behaviour); instead we type the global `window.L` surface.

export interface LatLngExpression {
  lat: number;
  lng: number;
}

export interface LMap {
  setView(center: LatLngExpression, zoom: number): LMap;
  on(event: string, handler: (e: { latlng: LatLngExpression }) => void): LMap;
  off(event: string, handler: (e: { latlng: LatLngExpression }) => void): LMap;
  remove(): void;
  invalidateSize(): void;
  flyTo(center: LatLngExpression, zoom: number): LMap;
}

export interface LMarker {
  addTo(map: LMap): LMarker;
  setLatLng(latLng: LatLngExpression): LMarker;
  getLatLng(): LatLngExpression;
  on(event: string, handler: () => void): LMarker;
  remove(): void;
}

export interface LTileLayer {
  addTo(map: LMap): LTileLayer;
}

export interface LDivIcon {
  options?: Record<string, unknown>;
}

export interface LMarkerOptions {
  draggable?: boolean;
  icon?: LDivIcon;
}

export interface LDivIconOptions {
  html: string;
  className?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
}

export interface LTileLayerOptions {
  attribution?: string;
  maxZoom?: number;
}

export interface LeafletStatic {
  map(el: HTMLElement): LMap;
  tileLayer(url: string, opts?: LTileLayerOptions): LTileLayer;
  marker(pos: LatLngExpression, opts?: LMarkerOptions): LMarker;
  divIcon(opts: LDivIconOptions): LDivIcon;
}

export interface LeafletWindow {
  L?: LeafletStatic;
}

export function getLeaflet(): LeafletStatic | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as LeafletWindow).L ?? null;
}
