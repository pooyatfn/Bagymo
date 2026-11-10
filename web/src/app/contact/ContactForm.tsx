"use client";
import { useState } from "react";
import api from "@/lib/api";
import { apiErrorDetail } from "@/lib/errors";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CheckCircleIcon } from "@/components/icons";

const TOPICS = [
  { value: "general", label: "پرسش عمومی" },
  { value: "company", label: "همکاری به‌عنوان سازمان" },
  { value: "venue", label: "همکاری به‌عنوان مجموعه" },
  { value: "support", label: "پشتیبانی حساب کاربری" },
];

/** Public contact form → POST /api/contact/ (stored for staff, no login needed). */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", contact: "", topic: "general", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      setError("لطفاً پیام‌تان را کمی کامل‌تر بنویسید.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.post("/contact/", form);
      setSent(true);
    } catch (err) {
      setError(apiErrorDetail(err, "ارسال پیام انجام نشد. دوباره تلاش کنید."));
    } finally {
      setSending(false);
    }
  };

  if (sent)
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-5 text-brand-900" role="status">
        <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
        <div>
          <p className="font-semibold">پیام شما ثبت شد.</p>
          <p className="mt-1 text-sm leading-7 text-brand-800">از همان راهی که نوشته‌اید با شما تماس می‌گیریم.</p>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="نام و نام خانوادگی" value={form.name} onChange={set("name")} required maxLength={80} autoComplete="name" />
        <Input label="شماره موبایل یا ایمیل" value={form.contact} onChange={set("contact")} required maxLength={120} dir="ltr" className="text-start" />
      </div>
      <Select label="موضوع" value={form.topic} onChange={set("topic")}>
        {TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <Textarea label="پیام" value={form.message} onChange={set("message")} required maxLength={2000} rows={6} error={error || undefined} />
      <Button type="submit" size="lg" loading={sending} disabled={!form.name.trim() || !form.contact.trim()}>
        ارسال پیام
      </Button>
    </form>
  );
}
