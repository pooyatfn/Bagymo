"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function DiscoverPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [booking, setBooking] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    if (!user) return;
    api.get("/catalog/venues/").then((r) => setVenues(r.data.results || r.data)).catch(() => {});
  }, [user?.id]);

  const loadOffers = async (venueId: number) => {
    const res = await api.get(`/catalog/venues/${venueId}/offers/`);
    setOffers(res.data);
  };

  const handleBook = async (offerId: number) => {
    setBooking(offerId);
    try {
      const res = await api.post("/bookings/", { offer_id: offerId });
      alert(`رزرو شد! کد ورود: ${res.data.check_in_code}`);
      setBooking(null);
      setSelectedVenue(null);
      refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در رزرو");
      setBooking(null);
    }
  };

  if (!user) return null;

  const userGender = (user as any).gender;

  const filtered = venues.filter((v: any) => {
    const matchesSearch = !search || v.name?.includes(search) || v.district?.includes(search);
    if (!matchesSearch) return false;
    if (!userGender) return v.gender_policy === "mixed";
    if (userGender === "male") return v.gender_policy === "mixed" || v.gender_policy === "male";
    if (userGender === "female") return v.gender_policy === "mixed" || v.gender_policy === "female";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/employee/dashboard" className="text-lg font-bold text-emerald-700">باجم</Link>
          <div className="flex items-center gap-3">
            <Link href="/employee/dashboard" className="text-sm text-gray-500 hover:underline hidden sm:inline">داشبورد</Link>
            <Link href="/employee/bookings" className="text-sm text-gray-500 hover:underline hidden sm:inline">رزروهای من</Link>
            <span className="text-sm text-gray-500 hidden sm:inline">{user.phone_number}</span>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">کشف باشگاه‌ها</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              لیست
            </button>
            <button
              onClick={() => setView("map")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "map" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              نقشه
            </button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو بر اساس نام یا منطقه..."
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />

        {view === "map" ? (
          <div className="mb-6 h-[500px] rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <MapView
              venues={filtered}
              onSelect={(v: any) => { setSelectedVenue(v); loadOffers(v.id); }}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v: any) => (
            <div
              key={v.id}
              onClick={() => { setSelectedVenue(v); loadOffers(v.id); }}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate">{v.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{v.category_name}</span>
                  {v.gender_policy === "male" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">مردانه</span>}
                  {v.gender_policy === "female" && <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">زنانه</span>}
                </div>
              </div>
              <p className="text-sm text-gray-500">{v.district} &middot; {v.city}</p>
              {v.address && <p className="mt-1 text-xs text-gray-400 truncate">{v.address}</p>}
              {v.rating !== null && v.rating !== undefined && (
                <p className="mt-1 text-sm text-amber-600">&#9733; {Number(v.rating).toFixed(1)}</p>
              )}
              {v.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{v.description}</p>}
            </div>
          ))}
        </div>

        {/* Offer Modal */}
        {selectedVenue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedVenue(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedVenue.name}</h2>
                <button onClick={() => setSelectedVenue(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <p className="mb-1 text-sm text-gray-500">{selectedVenue.district} &middot; {selectedVenue.city}</p>
              {selectedVenue.address && <p className="mb-4 text-sm text-gray-400">{selectedVenue.address}</p>}

              {offers.length === 0 ? (
                <p className="py-8 text-center text-gray-400">آفری موجود نیست.</p>
              ) : (
                <div className="space-y-3">
                  {offers.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">{o.name}</p>
                        <p className="text-sm text-gray-500">{o.duration_minutes} دقیقه &middot; {o.session_type || o.gender_restriction}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-emerald-700">{formatTomans(o.price)}</p>
                        <button
                          onClick={() => handleBook(o.id)}
                          disabled={booking === o.id}
                          className="mt-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {booking === o.id ? "در حال رزرو..." : "رزرو"}
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
