"use client";
import { useCallback, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const TEHRAN = { lat: 35.6892, lng: 51.3890 };

const mapContainerStyle = { width: "100%", height: "100%" };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  mapId: "bagym-map",
};

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
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
    language: "fa",
    region: "IR",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selected, setSelected] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Init Places SearchBox
    if (inputRef.current) {
      searchBoxRef.current = new google.maps.places.SearchBox(inputRef.current);
      searchBoxRef.current.addListener("places_changed", () => {
        const places = searchBoxRef.current?.getPlaces();
        if (places && places.length > 0) {
          setSearchResults(places);
          // Pan to first result
          const loc = places[0].geometry?.location;
          if (loc) map.panTo(loc);
        }
      });
    }
  }, []);

  const fitBounds = useCallback((map: google.maps.Map, vens: Venue[]) => {
    const valid = vens.filter((v) => v.lat && v.lng);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setCenter({ lat: valid[0].lat!, lng: valid[0].lng! });
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      valid.forEach((v) => bounds.extend({ lat: v.lat!, lng: v.lng! }));
      map.fitBounds(bounds, 60);
    }
  }, []);

  const searchNearby = (type: string) => {
    const map = mapRef.current;
    if (!map) return;
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(
      { location: map.getCenter(), radius: 5000, type },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setSearchResults(results);
        }
      }
    );
  };

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 text-red-500">
        خطا در بارگذاری نقشه. کلید API را بررسی کنید.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
        در حال بارگذاری نقشه...
      </div>
    );
  }

  const validVenues = venues.filter((v) => v.lat && v.lng);
  const center = validVenues.length > 0
    ? { lat: validVenues[0].lat!, lng: validVenues[0].lng! }
    : TEHRAN;

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
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی باشگاه، استخر، سینما..."
              className="w-full px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Quick Filters */}
          {showSearch && (
            <div className="flex gap-2 p-3">
              {[
                { label: "باشگاه", type: "gym" },
                { label: "استخر", type: "swimming_pool" },
                { label: "سینما", type: "movie_theater" },
                { label: "یوگا", type: "yoga" },
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
              {searchResults.slice(0, 5).map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (r.geometry?.location) {
                      mapRef.current?.panTo(r.geometry.location);
                      mapRef.current?.setZoom(15);
                    }
                    setSearchResults([]);
                    setSearchQuery(r.name || "");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-right hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.vicinity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={mapOptions}
        onLoad={(map) => {
          onMapLoad(map);
          if (validVenues.length > 0) fitBounds(map, validVenues);
        }}
      >
        {validVenues.map((v) => (
          <Marker
            key={v.id}
            position={{ lat: v.lat!, lng: v.lng! }}
            onClick={() => setSelected(v)}
            title={v.name}
          />
        ))}

        {selected && selected.lat && selected.lng && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="text-right p-1 min-w-[160px]" dir="rtl">
              <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
              <p className="text-xs text-gray-500">{selected.category_name} &middot; {selected.district}</p>
              <button
                onClick={() => onSelect(selected)}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                مشاهده آفرها
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
