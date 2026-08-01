"use client";
import { useEffect, useRef } from "react";

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
  userLocation?: { lat: number; lng: number } | null;
  onSelect: (v: Venue) => void;
}

export default function MapView({ venues, userLocation, onSelect }: Props) {
  const mapRef = useRef<any>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      const center = userLocation ? [userLocation.lat, userLocation.lng] : [35.6892, 51.3890];
      const map = L.map(mapRef.current).setView(center, userLocation ? 13 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    };

    loadLeaflet();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update markers when venues or userLocation change
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // User location marker
    if (userLocation) {
      const el = L.divIcon({
        className: "",
        html: '<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: el }).addTo(map);
      markersRef.current.push(marker);
      map.flyTo([userLocation.lat, userLocation.lng], 13);
    }

    // Venue markers
    venues.forEach((v) => {
      if (!v.lat || !v.lng) return;
      const el = L.divIcon({
        className: "",
        html: '<div style="width:32px;height:32px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">G</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([v.lat, v.lng], { icon: el }).addTo(map);
      marker.on("click", () => onSelect(v));
      markersRef.current.push(marker);
    });
  }, [venues, userLocation]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
