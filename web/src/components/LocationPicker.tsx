"use client";
import { useEffect, useRef, useState } from "react";
import { loadLeaflet, LMap, pinHtml, TEHRAN, TILE_ATTRIBUTION, TILE_URL } from "@/lib/leaflet";
import { MapPinIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { persianNumbers } from "@/lib/format";

interface Props {
  onPick: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
  buttonText?: string;
}

/** Collapsible map: click or drag the pin, then confirm. */
export default function LocationPicker({ onPick, initialCenter = TEHRAN, buttonText = "انتخاب موقعیت روی نقشه" }: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const [lat0, lng0] = initialCenter;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current).setView([lat0, lng0], 13);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(m);
      const icon = L.divIcon({ className: "", html: pinHtml("#059673", "", 26), iconSize: [26, 26], iconAnchor: [13, 13] });
      const marker = L.marker([lat0, lng0], { draggable: true, icon }).addTo(m);
      setPicked({ lat: lat0, lng: lng0 });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setPicked({ lat: p.lat, lng: p.lng });
      });
      m.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setPicked({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      map.current = m;
      setTimeout(() => m.invalidateSize(), 100);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [open, lat0, lng0]);

  if (!open) {
    return (
      <Button variant="outline" className="w-full" icon={<MapPinIcon />} onClick={() => setOpen(true)}>
        {buttonText}
      </Button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div ref={el} className="isolate h-[320px] w-full" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
        <p className="text-xs text-ink-500" dir="ltr">
          {picked ? persianNumbers(`${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`) : "روی نقشه کلیک کنید"}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button
            size="sm"
            disabled={!picked}
            onClick={() => {
              if (picked) onPick(picked.lat, picked.lng);
              setOpen(false);
            }}
          >
            تایید موقعیت
          </Button>
        </div>
      </div>
    </div>
  );
}
