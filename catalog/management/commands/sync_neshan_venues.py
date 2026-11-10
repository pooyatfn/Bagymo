"""
Import / refresh venues from the Neshan Search API (v3).

    python manage.py sync_neshan_venues [--city tehran] [--category gym] [--dry-run]

Requires NESHAN_API_KEY: a *service* key (سرویس‌ها / Web service) from
platform.neshan.org. The Search service is not in the key's service list by
default: Neshan enables it per account after a support ticket. Neshan returns
name, address, neighbourhood and location only — no ratings or reviews.
"""
import json
import time

import requests
from django.conf import settings
from django.core.management.base import CommandError

from catalog.models import Venue
from catalog.venue_sync import (
    CATEGORIES,
    BaseVenueSyncCommand,
    Place,
    hashed_external_id,
    http_error,
)


def parse_item(item: dict) -> Place | None:
    loc = item.get("location") or {}
    try:
        lng, lat = float(loc["x"]), float(loc["y"])
    except (KeyError, TypeError, ValueError):
        return None
    title = (item.get("title") or "").strip()
    # v3 marks streets / regions with category "municipal" / "region"; only places are venues
    if not title or item.get("category", "place") != "place":
        return None
    return Place(
        external_id=hashed_external_id("neshan", title, lat, lng),
        title=title,
        lat=lat,
        lng=lng,
        address=(item.get("address") or "").strip(),
        neighbourhood=(item.get("neighbourhood") or item.get("region") or "").strip(),
    )


# Neshan-specific HTTP status codes → what the operator should do about them.
NESHAN_ERRORS = {
    480: "کلید API نامعتبر است یا ارسال نشده (NESHAN_API_KEY را بررسی کنید).",
    481: "سقف مصرف حساب نشان تمام شده است؛ اعتبار را در پنل نشان افزایش دهید.",
    483: "نوع کلید اشتباه است؛ باید کلید نوع «سرویس‌ها» (service.…) باشد، نه کلید نقشه وب.",
    484: "این کلید برای IP این سرور مجاز نیست؛ در پنل نشان «دامنه‌های مجاز» کلید را خالی کنید یا IP سرور را اضافه کنید.",
    485: "سرویس جستجو روی این کلید فعال نیست؛ فعال‌سازی آن با ارسال تیکت به پشتیبانی نشان انجام می‌شود.",
}


class NeshanClient:
    """Neshan Search API v3: GET /v3/search?q={"term": …, "center": {"latitude": …, "longitude": …}}"""

    def __init__(self, api_key: str, base_url: str, timeout: float = 15, delay: float = 0.3):
        self.session = requests.Session()
        self.session.headers.update({"Api-Key": api_key})
        self.url = base_url.rstrip("/") + "/v3/search"
        self.timeout = timeout
        self.delay = delay
        self.requests = 0

    def search(self, term: str, lat: float, lng: float) -> list[dict]:
        q = json.dumps({"term": term, "center": {"latitude": lat, "longitude": lng}}, ensure_ascii=False)
        for attempt in range(3):
            self.requests += 1
            try:
                resp = self.session.get(self.url, params={"q": q}, timeout=self.timeout)
            except requests.RequestException as exc:
                if attempt == 2:
                    raise CommandError(f"اتصال به نشان برقرار نشد: {exc}") from exc
                time.sleep(2 * (attempt + 1))
                continue
            if resp.status_code in (429, 482):  # per-minute rate limit
                time.sleep(5 * (attempt + 1))
                continue
            if resp.status_code in NESHAN_ERRORS:
                raise CommandError(f"Neshan ({resp.status_code}): {NESHAN_ERRORS[resp.status_code]}")
            if resp.status_code >= 400:
                raise http_error("Neshan", resp)
            time.sleep(self.delay)
            return resp.json().get("items") or []
        raise CommandError("نشان تعداد درخواست در دقیقه را محدود کرد. کمی بعد دوباره اجرا کنید.")

    def discover(self, slug: str, lat: float, lng: float, radius_m: float) -> list[Place]:
        out = []
        for term in CATEGORIES[slug].terms:
            out.extend(p for p in (parse_item(i) for i in self.search(term, lat, lng)) if p)
        return out


class Command(BaseVenueSyncCommand):
    help = "Import or refresh venues from the Neshan search API (new ones are created as pending)."
    provider_name = "Neshan"
    source = Venue.Source.NESHAN

    def make_client(self, opts):
        if not settings.NESHAN_API_KEY:
            raise CommandError("NESHAN_API_KEY در .env تنظیم نشده است.")
        return NeshanClient(settings.NESHAN_API_KEY, settings.NESHAN_SEARCH_BASE_URL, delay=opts["delay"])
