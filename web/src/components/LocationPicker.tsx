"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  onPick: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
  buttonText?: string;
}

export default function LocationPicker({ onPick, initialCenter = [35.6892, 51.3890], buttonText = "📍 انتخاب موقعیت از نقشه" }: Props) {
  const [showMap, setShowMap] = useState(false);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!showMap || !mapRef.current || leafletMap.current) return;

    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      const map = L.map(mapRef.current).setView(initialCenter, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(initialCenter, { draggable: true }).addTo(map);
      setPicked(initialCenter);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setPicked([pos.lat, pos.lng]);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setPicked([e.latlng.lat, e.latlng.lng]);
      });

      leafletMap.current = map;
      markerRef.current = marker;

      // Fix map sizing
      setTimeout(() => map.invalidateSize(), 100);
    };

    loadLeaflet();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [showMap]);

  return (
    <div>
      <button
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
              {picked ? `${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}` : "روی نقشه کلیک کنید"}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowMap(false)} className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100">
                انصراف
              </button>
              <button
                onClick={() => {
                  if (picked) {
                    onPick(picked[0], picked[1]);
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
