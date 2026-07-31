"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function DiscoverPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [booking, setBooking] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/catalog/venues/").then((r) => setVenues(r.data.results || r.data)).catch(() => {});
  }, [user]);

  const loadOffers = async (venueId: number) => {
    const res = await api.get(`/catalog/offers/?venue=${venueId}`);
    setOffers(res.data.results || res.data);
  };

  const handleBook = async (offerId: number) => {
    setBooking(offerId);
    try {
      const res = await api.post("/bookings/", { offer_id: offerId });
      alert(`Booked! Check-in code: ${res.data.check_in_code}`);
      setBooking(null);
      setSelectedVenue(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Booking failed");
      setBooking(null);
    }
  };

  if (!user) return null;

  const filtered = venues.filter((v: any) =>
    !search || v.name.includes(search) || v.district?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/employee/dashboard" className="text-lg font-bold text-emerald-700">Bagym</Link>
          <div className="flex items-center gap-4">
            <Link href="/employee/dashboard" className="text-sm text-gray-500 hover:underline">Dashboard</Link>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">Logout</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Discover Venues</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or district..."
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v: any) => (
            <div
              key={v.id}
              onClick={() => { setSelectedVenue(v); loadOffers(v.id); }}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{v.name}</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{v.category_name}</span>
              </div>
              <p className="text-sm text-gray-500">{v.district} &middot; {v.city}</p>
              {v.rating !== null && (
                <p className="mt-1 text-sm text-amber-600">&#9733; {Number(v.rating).toFixed(1)}</p>
              )}
              {v.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{v.description}</p>}
            </div>
          ))}
        </div>

        {/* Offer Modal */}
        {selectedVenue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedVenue(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedVenue.name}</h2>
                <button onClick={() => setSelectedVenue(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              <p className="mb-4 text-sm text-gray-500">{selectedVenue.district} &middot; {selectedVenue.city}</p>

              {offers.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No offers available for this venue.</p>
              ) : (
                <div className="space-y-3">
                  {offers.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">{o.name}</p>
                        <p className="text-sm text-gray-500">{o.duration_minutes} min &middot; {o.session_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700">{formatTomans(o.price)}</p>
                        <button
                          onClick={() => handleBook(o.id)}
                          disabled={booking === o.id}
                          className="mt-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {booking === o.id ? "Booking..." : "Book Now"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
