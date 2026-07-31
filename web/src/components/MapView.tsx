"use client";
import { useEffect, useRef, useState } from "react";
import { MapComponent, MapTypes } from "@neshan-maps-platform/mapbox-gl-react";
import "@neshan-maps-platform/mapbox-gl-react/dist/style.css";
import nmp_mapboxgl from "@neshan-maps-platform/mapbox-gl";

interface Venue {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  category_name?: string;
  district?: string;
  address?: string;
}

interface Props {
  venues: Venue[];
  onSelect: (v: Venue) => void;
}

export default function MapView({ venues, onSelect }: Props) {
  const mapRef = useRef<any>(null);
  const markersRef: any[] = [];
  const [selected, setSelected] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const MAP_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY || "";

  // Add markers when venues change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear old markers
    markersRef.forEach((m) => m.remove());
    markersRef.length = 0;
    venues.forEach((v) => {
      if (!v.lat || !v.lng) return;
      const el = document.createElement("div");
      el.style.cssText = "width:32px;height:32px;background:emerald-500;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;";
      const inner = document.createElement("div");
      inner.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:bold;";
      inner.textContent = "G";
      el.appendChild(inner);

      const marker = new nmp_mapboxgl.Marker({ element: el })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      marker.getElement().addEventListener("click", () => setSelected(v));
      markersRef.push(marker);
    });
  }, [venues]);

  const searchNearby = (type: string) => {
    // Neshan POI search via their API
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    fetch(`https://api.neshan.net/v2/poi?lat=${center.lat}&lng=${center.lng}&type=${type}`, {
      headers: { "Api-Key": MAP_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setSearchResults(data.items);
      })
      .catch(() => {});
  };

  if (!MAP_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500 text-center p-8">
        <div>
          <p className="text-lg font-semibold mb-2">کلید API نشان تنظیم نشده</p>
          <p className="text-sm text-gray-400 mb-4">
            از <a href="https://platform.neshan.org/panel/api-key" target="_blank" className="text-emerald-600 underline">پلتفرم نشان</a> کلید دریافت کنید
          </p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded">NEXT_PUBLIC_NESHAN_API_KEY=...</code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Search Bar */}
      <div className="absolute left-3 right-3 top-3 z-10">
        <div className="rounded-xl bg-white shadow-lg overflow-hidden">
          <div className="flex items-center border-b border-gray-200">
            <span className="pl-3 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی باشگاه، استخر، سینما..."
              className="w-full px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Quick Filters */}
          {showFilters && (
            <div className="flex gap-2 p-3 flex-wrap">
              {[
                { label: "باشگاه", type: "gym" },
                { label: "استخر", type: "pool" },
                { label: "سینما", type: "cinema" },
                { label: "یوگا", type: "yoga" },
                { label: "ورزشگاه", type: "sport" },
              ].map((f) => (
                <button
                  key={f.type}
                  onClick={() => searchNearby(f.type)}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto border-t border-gray-100">
              {searchResults.slice(0, 5).map((r: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    if (r.location) {
                      mapRef.current?.flyTo({ center: [r.location.x, r.location.y], zoom: 15 });
                    }
                    setSearchResults([]);
                    setSearchQuery(r.title || r.name || "");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-right hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.title || r.name}</p>
                    <p className="text-xs text-gray-500">{r.address || r.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Neshan Map */}
      <div className="h-full w-full">
        <MapComponent
          options={{
            mapKey: MAP_KEY,
            mapType: MapTypes.neshanVector,
            center: [51.389, 35.6892], // Tehran
            zoom: 12,
            poi: false,
            traffic: false,
          }}
          mapSetter={(map: any) => { mapRef.current = map; }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Selected Venue Popup */}
      {selected && selected.lat && selected.lng && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="rounded-xl bg-white p-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-1">{selected.category_name} &middot; {selected.district}</p>
            {selected.address && <p className="text-xs text-gray-400 mb-3">{selected.address}</p>}
            <button
              onClick={() => onSelect(selected)}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              مشاهده آفرها
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
