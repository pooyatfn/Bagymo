"use client";
import { useEffect, useRef, useState } from "react";
import type { Venue } from "@/lib/types";
import { loadLeaflet, LMap, LMarker, pinHtml, TEHRAN, TILE_ATTRIBUTION, TILE_URL } from "@/lib/leaflet";

interface Props {
  venues: Venue[];
  userLocation?: { lat: number; lng: number } | null;
  onSelect: (v: Venue) => void;
}

export default function MapView({ venues, userLocation, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const markers = useRef<LMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // create the map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !el.current || map.current) return;
      map.current = L.map(el.current, { zoomControl: true }).setView(TEHRAN, 12);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map.current);
      setTimeout(() => map.current?.invalidateSize(), 100);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // sync markers whenever data changes (after the map exists)
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      const m = map.current;
      if (cancelled || !m) return;
      markers.current.forEach((mk) => mk.remove());
      markers.current = [];

      const points: [number, number][] = [];
      venues.forEach((v) => {
        if (v.lat == null || v.lng == null) return;
        const icon = L.divIcon({ className: "", html: pinHtml("#059673", "●", 30), iconSize: [30, 30], iconAnchor: [15, 15] });
        const mk = L.marker([v.lat, v.lng], { icon, title: v.name }).addTo(m);
        mk.on("click", () => onSelectRef.current(v));
        markers.current.push(mk);
        points.push([v.lat, v.lng]);
      });

      if (userLocation) {
        const icon = L.divIcon({ className: "", html: pinHtml("#2563eb", "", 18), iconSize: [18, 18], iconAnchor: [9, 9] });
        markers.current.push(L.marker([userLocation.lat, userLocation.lng], { icon, title: "موقعیت شما" }).addTo(m));
        m.setView([userLocation.lat, userLocation.lng], 13);
      } else if (points.length > 1) {
        m.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
      } else if (points.length === 1) {
        m.setView(points[0], 14);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, venues, userLocation]);

  return <div ref={el} className="h-full w-full" />;
}
