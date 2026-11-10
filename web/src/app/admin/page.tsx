"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  DashboardSkeleton,
  DetailRow,
  EmptyRow,
  EmptyState,
  fieldClass,
  Modal,
  StatCard,
  StatusBadge,
  Table,
  Tabs,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  useToast,
} from "@/components/ui";
import { BanknotesIcon, BuildingIcon, CheckIcon, ClockIcon, SearchIcon, StoreIcon, XMarkIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { apiErrorDetail } from "@/lib/errors";
import { formatDate, formatDateTime, formatNumber, formatTomans, formatTomansShort, GENDER_LABELS } from "@/lib/format";
import type { AdminCompany, Booking, PendingCompany, Venue } from "@/lib/types";

type Tab = "pending" | "venues" | "companies" | "bookings";
type RejectTarget = { kind: "venue" | "company"; id: number; name: string };

/** Platform margin ≈ 3% employee commission + 3% venue commission. */
const PLATFORM_MARGIN = 0.06;

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin";

  const pendingVenues = useApi<Venue[]>(isAdmin ? "/catalog/pending-venues/" : null);
  const pendingCompanies = useApi<PendingCompany[]>(isAdmin ? "/catalog/pending-companies/" : null);
  const venues = useApi<Venue[]>(isAdmin ? "/catalog/admin-venues/" : null);
  const companies = useApi<AdminCompany[]>(isAdmin ? "/catalog/admin-companies/" : null);
  const bookings = useApi<Booking[]>(isAdmin ? "/billing/company-bookings/" : null);

  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [reject, setReject] = useState<RejectTarget | null>(null);
  const [reason, setReason] = useState("");
  const [venueDetail, setVenueDetail] = useState<Venue | null>(null);
  const [companyDetail, setCompanyDetail] = useState<AdminCompany | null>(null);

  const refetchAll = () => {
    pendingVenues.refetch();
    pendingCompanies.refetch();
    venues.refetch();
    companies.refetch();
  };

  const approve = async (kind: "venue" | "company", id: number, name: string) => {
    setBusy(`${kind}-${id}`);
    try {
      await api.post(kind === "venue" ? `/catalog/venues/${id}/approve/` : `/catalog/companies/${id}/approve/`);
      toast.success(`«${name}» تأیید شد`, "به مدیر آن پیامک اطلاع‌رسانی ارسال شد.");
      refetchAll();
    } catch (err) {
      toast.error("تأیید انجام نشد", apiErrorDetail(err));
    }
    setBusy(null);
  };

  const confirmReject = async () => {
    if (!reject) return;
    setBusy(`${reject.kind}-${reject.id}`);
    try {
      const url = reject.kind === "venue" ? `/catalog/venues/${reject.id}/reject/` : `/catalog/companies/${reject.id}/reject/`;
      await api.post(url, { reason });
      toast.info(`درخواست «${reject.name}» رد شد`);
      setReject(null);
      setReason("");
      refetchAll();
    } catch (err) {
      toast.error("رد درخواست انجام نشد", apiErrorDetail(err));
    }
    setBusy(null);
  };

  const pv = pendingVenues.data || [];
  const pc = pendingCompanies.data || [];
  const vList = venues.data || [];
  const cList = companies.data || [];
  const bList = bookings.data || [];
  const gmv = bList.reduce((s, b) => s + (b.status !== "cancelled" && b.status !== "expired" ? b.price : 0), 0);
  const loading = pendingVenues.loading || pendingCompanies.loading || venues.loading || companies.loading;

  const q = query.trim();
  const fVenues = q ? vList.filter((v) => v.name.includes(q) || v.district?.includes(q)) : vList;
  const fCompanies = q ? cList.filter((c) => c.name.includes(q) || c.domain?.includes(q)) : cList;
  const fBookings = q ? bList.filter((b) => b.venue_name?.includes(q) || b.employee_name?.includes(q) || b.employee_phone?.includes(q)) : bList;

  return (
    <PageShell roles={["admin"]} title="پنل مدیریت پلتفرم" subtitle="بررسی درخواست‌ها و نظارت بر سازمان‌ها، مجموعه‌ها و رزروها.">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="در انتظار بررسی" value={formatNumber(pv.length + pc.length)} icon={<ClockIcon />} tone="amber" />
            <StatCard label="سازمان‌ها" value={formatNumber(cList.length)} icon={<BuildingIcon />} tone="sky" />
            <StatCard label="مجموعه‌ها" value={formatNumber(vList.length)} icon={<StoreIcon />} />
            <StatCard
              label="درآمد تخمینی پلتفرم"
              value={formatTomansShort(gmv * PLATFORM_MARGIN)}
              hint={`از ${formatTomansShort(gmv)} گردش`}
              icon={<BanknotesIcon />}
              tone="violet"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={tab}
              onChange={(t) => {
                setTab(t);
                setQuery("");
              }}
              items={[
                { key: "pending", label: "درخواست‌ها", count: pv.length + pc.length },
                { key: "companies", label: "سازمان‌ها", count: cList.length },
                { key: "venues", label: "مجموعه‌ها", count: vList.length },
                { key: "bookings", label: "رزروها", count: bList.length },
              ]}
            />
            {tab !== "pending" && (
              <div className="relative md:w-72">
                <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو…"
                  className={cn(fieldClass(), "h-10 ps-9")}
                  aria-label="جستجو"
                />
              </div>
            )}
          </div>

          {tab === "pending" &&
            (pv.length + pc.length === 0 ? (
              <Card>
                <EmptyState icon={<CheckIcon />} title="همه درخواست‌ها بررسی شده‌اند" description="درخواست جدیدی برای تأیید وجود ندارد." />
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                {pc.length > 0 && (
                  <Card p="none">
                    <div className="p-5 pb-2">
                      <CardHeader className="mb-0" title="سازمان‌های جدید" description="پس از تأیید، مدیر سازمان می‌تواند وارد شود." />
                    </div>
                    <ul className="divide-y divide-line">
                      {pc.map((c) => (
                        <PendingRow
                          key={c.id}
                          icon={<BuildingIcon />}
                          title={c.name}
                          lines={[
                            `مدیر: ${c.admin_name || "—"} · ${c.admin_phone || "—"}`,
                            `بودجه پیش‌فرض: ${formatTomans(c.default_annual_budget)} · ${formatDate(c.created_at)}`,
                          ]}
                          busy={busy === `company-${c.id}`}
                          onApprove={() => approve("company", c.id, c.name)}
                          onReject={() => setReject({ kind: "company", id: c.id, name: c.name })}
                        />
                      ))}
                    </ul>
                  </Card>
                )}
                {pv.length > 0 && (
                  <Card p="none">
                    <div className="p-5 pb-2">
                      <CardHeader className="mb-0" title="مجموعه‌های جدید" description="پس از تأیید، در فهرست کارکنان نمایش داده می‌شوند." />
                    </div>
                    <ul className="divide-y divide-line">
                      {pv.map((v) => (
                        <PendingRow
                          key={v.id}
                          icon={categoryMeta(v.category_slug, v.category_name).icon}
                          title={v.source === "neshan" ? `${v.name} · از نقشه نشان` : v.name}
                          lines={[
                            `${categoryMeta(v.category_slug, v.category_name).label} · ${[v.district, v.city].filter(Boolean).join("، ")}`,
                            [v.owner_name, v.phone].filter(Boolean).join(" · ") || v.address || "",
                          ]}
                          busy={busy === `venue-${v.id}`}
                          onApprove={() => approve("venue", v.id, v.name)}
                          onReject={() => setReject({ kind: "venue", id: v.id, name: v.name })}
                        />
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            ))}

          {tab === "companies" && (
            <Card p="none" className="overflow-hidden">
              <Table>
                <THead>
                  <Th>سازمان</Th>
                  <Th>کارکنان</Th>
                  <Th>بودجه پیش‌فرض</Th>
                  <Th>رزرو</Th>
                  <Th>گردش</Th>
                  <Th>وضعیت</Th>
                </THead>
                <TBody>
                  {fCompanies.length === 0 ? (
                    <EmptyRow colSpan={6}>سازمانی پیدا نشد.</EmptyRow>
                  ) : (
                    fCompanies.map((c) => (
                      <Tr key={c.id} onClick={() => setCompanyDetail(c)}>
                        <Td>
                          <p className="font-medium text-ink-900">{c.name}</p>
                          {c.domain && <p className="text-xs text-ink-500" dir="ltr" style={{ textAlign: "right" }}>{c.domain}</p>}
                        </Td>
                        <Td className="tabular">{formatNumber(c.employee_count)}</Td>
                        <Td className="tabular">{formatTomans(c.default_annual_budget)}</Td>
                        <Td className="tabular">{formatNumber(c.total_bookings)}</Td>
                        <Td className="tabular font-medium text-ink-900">{formatTomans(c.total_spent)}</Td>
                        <Td>
                          <StatusBadge status={(c as AdminCompany & { status?: string }).status || (c.is_active ? "active" : "inactive")} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </Card>
          )}

          {tab === "venues" && (
            <Card p="none" className="overflow-hidden">
              <Table>
                <THead>
                  <Th>مجموعه</Th>
                  <Th>نوع</Th>
                  <Th>محله</Th>
                  <Th>امتیاز</Th>
                  <Th>وضعیت</Th>
                </THead>
                <TBody>
                  {fVenues.length === 0 ? (
                    <EmptyRow colSpan={5}>مجموعه‌ای پیدا نشد.</EmptyRow>
                  ) : (
                    fVenues.map((v) => {
                      const cat = categoryMeta(v.category_slug, v.category_name);
                      return (
                        <Tr key={v.id} onClick={() => setVenueDetail(v)}>
                          <Td>
                            <div className="flex items-center gap-3">
                              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px]", cat.tint)}>{cat.icon}</span>
                              <span className="font-medium text-ink-900">{v.name}</span>
                            </div>
                          </Td>
                          <Td>{cat.label}</Td>
                          <Td>{[v.district, v.city === "Tehran" ? "تهران" : v.city].filter(Boolean).join("، ")}</Td>
                          <Td className="tabular">{v.avg_rating != null ? `${formatNumber(v.avg_rating)} ★` : "—"}</Td>
                          <Td>
                            <StatusBadge status={v.status} />
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </TBody>
              </Table>
            </Card>
          )}

          {tab === "bookings" && (
            <Card p="none" className="overflow-hidden">
              <Table>
                <THead>
                  <Th>کارمند</Th>
                  <Th>مجموعه و خدمت</Th>
                  <Th>زمان</Th>
                  <Th>مبلغ</Th>
                  <Th>وضعیت</Th>
                </THead>
                <TBody>
                  {fBookings.length === 0 ? (
                    <EmptyRow colSpan={5}>رزروی پیدا نشد.</EmptyRow>
                  ) : (
                    fBookings.map((b) => (
                      <Tr key={b.id}>
                        <Td>
                          <Link href={`/admin/user/${b.employee_id}`} className="flex items-center gap-3 hover:text-brand-700">
                            <Avatar name={b.employee_name || b.employee_phone} size="sm" />
                            <span>
                              <span className="block font-medium text-ink-900">{b.employee_name || "—"}</span>
                              <span className="block text-xs text-ink-500">{b.employee_phone}</span>
                            </span>
                          </Link>
                        </Td>
                        <Td>
                          <p className="text-ink-900">{b.venue_name}</p>
                          <p className="text-xs text-ink-500">{b.offer_name}</p>
                        </Td>
                        <Td className="whitespace-nowrap text-xs">{formatDateTime(b.reserved_at)}</Td>
                        <Td className="tabular font-medium text-ink-900">{formatTomans(b.price)}</Td>
                        <Td>
                          <StatusBadge status={b.status} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        size="sm"
        title={reject?.kind === "venue" ? "رد درخواست مجموعه" : "رد درخواست سازمان"}
        description={reject?.name}
        footer={
          <>
            <Button variant="outline" onClick={() => setReject(null)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={confirmReject} loading={!!reject && busy === `${reject.kind}-${reject.id}`}>
              رد درخواست
            </Button>
          </>
        }
      >
        <Textarea label="دلیل (برای متقاضی پیامک می‌شود)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="اختیاری" />
      </Modal>

      <Modal open={!!venueDetail} onClose={() => setVenueDetail(null)} title={venueDetail?.name} description={venueDetail && categoryMeta(venueDetail.category_slug, venueDetail.category_name).label}>
        {venueDetail && (
          <dl className="divide-y divide-line">
            <DetailRow label="وضعیت"><StatusBadge status={venueDetail.status} /></DetailRow>
            <DetailRow label="مدیر">{venueDetail.owner_name || "—"}</DetailRow>
            <DetailRow label="تلفن"><span dir="ltr">{venueDetail.phone || "—"}</span></DetailRow>
            <DetailRow label="نشانی">{venueDetail.address || "—"}</DetailRow>
            <DetailRow label="پذیرش">{GENDER_LABELS[venueDetail.gender_policy] ?? venueDetail.gender_policy}</DetailRow>
            <DetailRow label="خدمات">{formatNumber(venueDetail.offers?.length ?? 0)}</DetailRow>
            <DetailRow label="تاریخ ثبت">{formatDate(venueDetail.created_at)}</DetailRow>
          </dl>
        )}
      </Modal>

      <Modal open={!!companyDetail} onClose={() => setCompanyDetail(null)} title={companyDetail?.name} description={companyDetail?.domain || undefined}>
        {companyDetail && (
          <dl className="divide-y divide-line">
            <DetailRow label="وضعیت"><StatusBadge status={(companyDetail as AdminCompany & { status?: string }).status || (companyDetail.is_active ? "active" : "inactive")} /></DetailRow>
            <DetailRow label="کارکنان">{formatNumber(companyDetail.employee_count)}</DetailRow>
            <DetailRow label="بودجه پیش‌فرض">{formatTomans(companyDetail.default_annual_budget)}</DetailRow>
            <DetailRow label="تعداد رزرو">{formatNumber(companyDetail.total_bookings)}</DetailRow>
            <DetailRow label="گردش مالی">{formatTomans(companyDetail.total_spent)}</DetailRow>
            <DetailRow label="تاریخ ثبت">{formatDate(companyDetail.created_at)}</DetailRow>
          </dl>
        )}
      </Modal>
    </PageShell>
  );
}

function PendingRow({
  icon,
  title,
  lines,
  busy,
  onApprove,
  onReject,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900">{title}</p>
        {lines.filter(Boolean).map((l, i) => (
          <p key={i} className="mt-0.5 truncate text-xs text-ink-500">
            {l}
          </p>
        ))}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={onApprove} loading={busy} icon={<CheckIcon />}>
          تأیید
        </Button>
        <Button size="sm" variant="soft-danger" onClick={onReject} disabled={busy} icon={<XMarkIcon />}>
          رد
        </Button>
      </div>
    </li>
  );
}

