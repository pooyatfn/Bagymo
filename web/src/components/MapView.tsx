"use client";
import { useEffect, useState } from "react";
import { useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix leaflet default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface Venue {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  category_name?: string;
  district?: string;
}

function FitBounds({ venues }: { venues: Venue[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = venues.filter((v) => v.lat && v.lng);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat!, valid[0].lng!], 14);
    } else {
      const bounds = L.latLngBounds(valid.map((v) => [v.lat!, v.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [venues, map]);
  return null;
}

export default function MapView({ venues, onSelect }: { venues: Venue[]; onSelect: (v: Venue) => void }) {
  const [mounted, setMounted] = useState(false);
  const [MapContainer, setMapContainer] = useState<any>(null);

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      setMapContainer(() => mod.MapContainer);
      setMounted(true);
    });
  }, []);

  if (!mounted || !MapContainer) {
    return <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">Loading map...</div>;
  }

  const valid = venues.filter((v) => v.lat && v.lng);
  const center: [number, number] = valid.length > 0
    ? [valid[0].lat!, valid[0].lng!]
    : [35.6892, 51.3890]; // Tehran default

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <FitBounds venues={venues} />
      {valid.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat!, v.lng!]}
          eventHandlers={{ click: () => onSelect(v) }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">{v.name}</p>
              <p className="text-sm text-gray-500">{v.category_name} &middot; {v.district}</p>
              <button
                onClick={() => onSelect(v)}
                className="mt-2 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
              >
                View Offers
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
