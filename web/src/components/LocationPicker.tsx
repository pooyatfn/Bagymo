"use client";
import { useEffect, useRef, useState } from "react";
import { getLeaflet, LMap, LMarker, LatLngExpression } from "@/lib/leaflet";

interface Props {
  onPick: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
  buttonText?: string;
}

export default function LocationPicker({
  onPick,
  initialCenter = [35.6892, 51.389],
  buttonText = "انتخاب موقعیت از نقشه",
}: Props) {
  const [showMap, setShowMap] = useState(false);
  const [picked, setPicked] = useState<LatLngExpression | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);

  useEffect(() => {
    if (!showMap || !mapRef.current) return;

    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!getLeaflet()) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = getLeaflet();
      if (!L || leafletMap.current) return;

      const center: LatLngExpression = {
        lat: initialCenter[0],
        lng: initialCenter[1],
      };
      const map = L.map(mapRef.current as HTMLElement).setView(center, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(center, { draggable: true }).addTo(map);
      setPicked(center);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setPicked({ lat: pos.lat, lng: pos.lng });
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setPicked({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      leafletMap.current = map;
      markerRef.current = marker;

      setTimeout(() => map.invalidateSize(), 100);
    };

    void loadLeaflet();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [showMap, initialCenter]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
      >
        {buttonText}
      </button>

      {showMap && (
        <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
          <div ref={mapRef} className="h-[350px] w-full" />
          <div className="flex items-center justify-between bg-white px-3 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {picked
                ? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`
                : "روی نقشه کلیک کنید"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  if (picked) {
                    onPick(picked.lat, picked.lng);
                    setShowMap(false);
                  }
                }}
                disabled={!picked}
                className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                تایید موقعیت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
