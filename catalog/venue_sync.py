"""
Shared logic for importing venues from a map provider (Neshan).

A provider client implements `discover(slug, lat, lng, radius_m) -> list[Place]`.
`BaseVenueSyncCommand` walks a grid of search centers per category and hands
every Place to `upsert_place`, which:

- creates new places as *pending* venues (an admin approves them),
- refreshes still-pending venues it created earlier (matched by external_id),
- never overwrites approved/suspended venues (staff may have edited them),
- skips places that duplicate an existing venue (same name within ~150 m).
"""
from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass, field

import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from catalog.models import Category, Venue


@dataclass(frozen=True)
class CategorySpec:
    name_fa: str
    name_en: str
    terms: tuple[str, ...]  # search queries
    keywords: tuple[str, ...]  # one must appear in the title


CATEGORIES: dict[str, CategorySpec] = {
    "gym": CategorySpec("باشگاه بدنسازی", "Gym", ("باشگاه بدنسازی", "باشگاه ورزشی", "فیتنس"),
                        ("باشگاه", "بدنسازی", "فیتنس", "ورزش", "gym", "fitness")),
    "pool": CategorySpec("استخر", "Pool", ("استخر", "پارک آبی"),
                         ("استخر", "پارک آبی", "pool", "aqua")),
    "cinema": CategorySpec("سینما", "Cinema", ("سینما", "پردیس سینمایی"),
                           ("سینما", "پردیس", "cinema")),
    "yoga": CategorySpec("یوگا", "Yoga", ("یوگا",), ("یوگا", "yoga")),
    "sport": CategorySpec("مجموعه ورزشی", "Sports complex", ("مجموعه ورزشی", "سالن ورزشی"),
                          ("ورزش", "sport")),
}

# city key → (Persian name stored on the venue, center lat, center lng)
CITIES: dict[str, tuple[str, float, float]] = {
    "tehran": ("تهران", 35.6997, 51.3380),
    "karaj": ("کرج", 35.8327, 50.9915),
    "mashhad": ("مشهد", 36.2972, 59.6067),
    "isfahan": ("اصفهان", 32.6539, 51.6660),
    "shiraz": ("شیراز", 29.5918, 52.5837),
    "tabriz": ("تبریز", 38.0800, 46.2919),
    "qom": ("قم", 34.6399, 50.8759),
    "ahvaz": ("اهواز", 31.3183, 48.6706),
}

# results whose title starts with one of these are streets / squares / stations, not venues
NON_VENUE_PREFIXES = ("خیابان", "کوچه", "بن بست", "بلوار", "میدان", "بزرگراه", "اتوبان", "پل", "ایستگاه", "پارکینگ")
DUPLICATE_RADIUS_M = 150
_FA_NORMALIZE = str.maketrans({"ي": "ی", "ك": "ک", "‌": " ", "ـ": ""})


def normalize_name(name: str) -> str:
    name = (name or "").translate(_FA_NORMALIZE)
    return re.sub(r"\s+", " ", name).strip().lower()


def hashed_external_id(prefix: str, title: str, lat: float, lng: float) -> str:
    """Neshan has no stable place ids: hash of name + rounded position."""
    raw = f"{normalize_name(title)}|{lat:.4f}|{lng:.4f}"
    return f"{prefix}:" + hashlib.sha1(raw.encode()).hexdigest()[:20]


def distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def grid_points(lat: float, lng: float, size: int, spacing_km: float) -> list[tuple[float, float]]:
    """size×size search centers around (lat, lng)."""
    half = (size - 1) / 2
    dlat = spacing_km / 111.0
    dlng = spacing_km / (111.0 * math.cos(math.radians(lat)))
    return [(lat + (i - half) * dlat, lng + (j - half) * dlng) for i in range(size) for j in range(size)]


@dataclass
class Place:
    external_id: str
    title: str
    lat: float
    lng: float
    address: str = ""
    neighbourhood: str = ""


@dataclass
class Stats:
    requests: int = 0
    found: int = 0
    created: int = 0
    updated: int = 0
    unchanged: int = 0
    duplicates: int = 0
    filtered: int = 0
    errors: list[str] = field(default_factory=list)


def matches_category(place: Place, spec: CategorySpec) -> bool:
    title = normalize_name(place.title)
    if title.startswith(NON_VENUE_PREFIXES):
        return False
    return any(k in title for k in spec.keywords)


def http_error(provider: str, resp: requests.Response) -> CommandError:
    if resp.status_code in (401, 403):
        return CommandError(
            f"{provider}: کلید API نامعتبر است یا سرویس «جستجو» برای این کلید فعال نیست "
            f"({resp.status_code}): {resp.text[:300]}"
        )
    return CommandError(f"{provider}: خطای {resp.status_code}: {resp.text[:300]}")


class BaseVenueSyncCommand(BaseCommand):
    """Subclasses set `provider_name`, `source`, and implement `make_client()`."""

    provider_name = ""
    source = Venue.Source.MANUAL
    default_spacing_km = 6.0

    def add_arguments(self, parser):
        parser.add_argument("--city", default="tehran", choices=sorted(CITIES), help="city to search (default: tehran)")
        parser.add_argument("--lat", type=float, help="custom search center latitude (overrides --city center)")
        parser.add_argument("--lng", type=float, help="custom search center longitude")
        parser.add_argument("--category", action="append", choices=sorted(CATEGORIES), help="limit to these categories (repeatable)")
        parser.add_argument("--grid", type=int, default=3, help="grid size N → N×N search centers (default 3)")
        parser.add_argument("--spacing-km", type=float, default=self.default_spacing_km, help="distance between grid centers")
        parser.add_argument("--delay", type=float, default=0.3, help="seconds to wait between API calls")
        parser.add_argument("--dry-run", action="store_true", help="show what would change without saving")

    def make_client(self, opts):  # pragma: no cover - abstract
        raise NotImplementedError

    def handle(self, *args, **opts):
        if (opts["lat"] is None) != (opts["lng"] is None):
            raise CommandError("--lat و --lng را با هم بدهید.")
        if opts["grid"] < 1:
            raise CommandError("--grid باید حداقل ۱ باشد.")
        client = self.make_client(opts)

        city_fa, lat0, lng0 = CITIES[opts["city"]]
        if opts["lat"] is not None:
            lat0, lng0 = opts["lat"], opts["lng"]
        slugs = opts["category"] or list(CATEGORIES)
        points = grid_points(lat0, lng0, opts["grid"], opts["spacing_km"])
        radius_m = max(1000.0, opts["spacing_km"] * 1000 * 0.75)
        dry = opts["dry_run"]
        stats = Stats()

        self.stdout.write(
            f"{self.provider_name} sync: {city_fa} · {len(slugs)} categories · {len(points)} search centers"
            + (" · DRY RUN" if dry else "")
        )
        for slug in slugs:
            spec = CATEGORIES[slug]
            category = self._category(slug, spec, dry)
            places: dict[str, Place] = {}
            for lat, lng in points:
                for place in client.discover(slug, lat, lng, radius_m):
                    stats.requests = client.requests
                    if not matches_category(place, spec):
                        stats.filtered += 1
                        continue
                    places.setdefault(place.external_id, place)
            stats.requests = client.requests
            stats.found += len(places)
            self.stdout.write(f"  {spec.name_fa}: {len(places)} places")
            for place in places.values():
                self.upsert_place(place, category, city_fa, dry, stats)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. requests={stats.requests} found={stats.found} created={stats.created} "
                f"updated={stats.updated} unchanged={stats.unchanged} duplicates_skipped={stats.duplicates} "
                f"filtered_out={stats.filtered}"
            )
        )
        if stats.created and not dry:
            self.stdout.write("New venues are pending — approve them in the admin panel (/admin → درخواست‌ها).")

    # -- persistence ------------------------------------------------------
    def _category(self, slug: str, spec: CategorySpec, dry: bool) -> Category | None:
        cat = Category.objects.filter(slug=slug).first()
        if cat is None and not dry:
            cat = Category.objects.create(slug=slug, name_fa=spec.name_fa, name_en=spec.name_en)
        return cat

    @staticmethod
    def _is_duplicate(place: Place) -> bool:
        box = DUPLICATE_RADIUS_M / 111_000 * 1.5
        nearby = Venue.objects.filter(
            lat__range=(place.lat - box, place.lat + box), lng__range=(place.lng - box, place.lng + box)
        ).only("name", "lat", "lng")
        name = normalize_name(place.title)
        return any(
            normalize_name(v.name) == name and distance_m(place.lat, place.lng, v.lat, v.lng) <= DUPLICATE_RADIUS_M
            for v in nearby
        )

    def upsert_place(self, place: Place, category: Category | None, city_fa: str, dry: bool, stats: Stats):
        now = timezone.now()
        venue = Venue.objects.filter(external_id=place.external_id).first()

        if venue is None:
            if self._is_duplicate(place):
                stats.duplicates += 1
                return
            stats.created += 1
            if dry:
                self.stdout.write(f"    + {place.title} — {place.neighbourhood or place.address}")
                return
            Venue.objects.create(
                category=category,
                name=place.title[:120],
                address=place.address[:300] or None,
                district=place.neighbourhood[:80] or None,
                city=city_fa,
                lat=place.lat,
                lng=place.lng,
                status=Venue.Status.PENDING,
                source=self.source,
                external_id=place.external_id,
                synced_at=now,
            )
            return

        if venue.status != Venue.Status.PENDING:
            stats.unchanged += 1
            if not dry:
                Venue.objects.filter(pk=venue.pk).update(synced_at=now)
            return

        fresh = {
            "address": place.address[:300] or venue.address,
            "district": place.neighbourhood[:80] or venue.district,
            "lat": place.lat,
            "lng": place.lng,
        }
        changed = {k: v for k, v in fresh.items() if getattr(venue, k) != v}
        if not changed:
            stats.unchanged += 1
            if not dry:
                Venue.objects.filter(pk=venue.pk).update(synced_at=now)
            return
        stats.updated += 1
        if dry:
            self.stdout.write(f"    ~ {venue.name}: {', '.join(changed)}")
            return
        Venue.objects.filter(pk=venue.pk).update(**changed, synced_at=now)
