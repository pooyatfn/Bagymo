"use client";
import { useEffect, useRef } from "react";
import { Venue } from "@/lib/types";
import { getLeaflet, LMap, LMarker, LatLngExpression } from "@/lib/leaflet";

interface Props {
  venues: Venue[];
  userLocation?: { lat: number; lng: number } | null;
  onSelect: (v: Venue) => void;
}

export default function MapView({ venues, userLocation, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const userLocationRef = useRef(userLocation);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Map init — runs once (deps empty), reads userLocation via ref.
  useEffect(() => {
    if (!mapRef.current) return;

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
      if (!L) return;

      const loc = userLocationRef.current;
      const center: LatLngExpression = loc
        ? { lat: loc.lat, lng: loc.lng }
        : { lat: 35.6892, lng: 51.389 };
      const map = L.map(mapRef.current!).setView(center, loc ? 13 : 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    };

    void loadLeaflet();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update markers / recenter when venues or location change.
  useEffect(() => {
    const map = leafletMap.current;
    const L = getLeaflet();
    if (!map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (userLocation) {
      const el = L.divIcon({
        className: "",
        html: '<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker(
        { lat: userLocation.lat, lng: userLocation.lng },
        { icon: el }
      ).addTo(map);
      markersRef.current.push(marker);
      map.flyTo({ lat: userLocation.lat, lng: userLocation.lng }, 13);
    }

    venues.forEach((v) => {
      if (!v.lat || !v.lng) return;
      const el = L.divIcon({
        className: "",
        html: '<div style="width:32px;height:32px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">G</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker({ lat: v.lat, lng: v.lng }, { icon: el }).addTo(map);
      marker.on("click", () => onSelect(v));
      markersRef.current.push(marker);
    });
  }, [venues, userLocation, onSelect]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
