"""
Seed script for bagymo MVP demo.
Creates: 1 company, 3 employees, 10 offers across 3 gyms, 1 venue staff,
and runs a demo booking to verify the commission math.
Run:  python manage.py seed_bagymo
"""
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from billing.services import reserve_booking
from catalog.models import Category, Company, Offer, TimeSlot, Venue, VenueCompanyAccess, VenueGenderSlot, VenueRating

DEMO_COMPANY_NAME = "شرکت نمونه باجیمو"

SAMPLE_GYMS = [
    {"name": "آهنگ زندگی", "address": "ولیعصر، بالاتر از میرداماد", "lat": 35.7664, "lng": 51.4121, "phone": "021-22221111", "district": "میرداماد", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی و فیتنس با تجهیزات مدرن"},
    {"name": "پولادین", "address": "خیابان ولیعصر، نبش کوچه بورس", "lat": 35.7210, "lng": 51.3950, "phone": "021-88887777", "district": "انقلاب", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی حرفه‌ای با مربیان مجرب"},
    {"name": "آرسی", "address": "ونک، بلوار شهید حقانی", "lat": 35.7810, "lng": 51.4260, "phone": "021-22003300", "district": "ونک", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی و فیتنس وانک"},
    {"name": "تکسان", "address": "سعادت آباد، بلوار پاکنژاد", "lat": 35.7850, "lng": 51.3620, "phone": "021-88445566", "district": "سعادت آباد", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی سعادت آباد"},
    {"name": "بادی فیتنس", "address": "تهرانپارس، خیابان ۱۹۶ شرقی", "lat": 35.7440, "lng": 51.5020, "phone": "021-77665544", "district": "تهرانپارس", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی تهرانپارس"},
    {"name": "استخر و سونا نگین", "address": "نیاوران، خیابان م المقدسی", "lat": 35.8050, "lng": 51.4580, "phone": "021-22881100", "district": "نیاوران", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر سرپوشیده و سونا و جکوزی"},
    {"name": "استخر المپیک", "address": "باقرشهر، بلوار الغدیر", "lat": 35.6200, "lng": 51.4800, "phone": "021-55443322", "district": "باقرشهر", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر المپیک با امکانات کامل"},
    {"name": "سینما آزادی", "address": "آزادی، میدان آزادی", "lat": 35.6990, "lng": 51.3370, "phone": "021-66445500", "district": "آزادی", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینما چند سالنه با صندلی‌های راحت"},
    {"name": "سینما کوروش", "address": "تهرانسر، بلوار شهید لشکری", "lat": 35.6830, "lng": 51.2430, "phone": "021-44556677", "district": "تهرانسر", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینما کوروش با سیستم صوتی دالبی"},
    {"name": "یوگا شیراز", "address": "خیابان شیراز، بالاتر از میدان فلسطین", "lat": 35.7180, "lng": 51.3960, "phone": "021-33221100", "district": "انقلاب", "city": "Tehran", "gender_policy": "female", "category": "yoga", "description": "مرکز یوگا و مدیتیشن بانوان"},
    {"name": "باشگاه اسکواش پارسیان", "address": "ولنجک، خیابان ۳۲", "lat": 35.7980, "lng": 51.3890, "phone": "021-22114455", "district": "ولنجک", "city": "Tehran", "gender_policy": "male", "category": "sport", "description": "باشگاه اسکواش حرفه‌ای"},
]

# Gender slots: time-based gender policies per venue
GENDER_SLOTS = {
    "پولادین": [
        {"day": "sat", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "sat", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "sun", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "sun", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "mon", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "mon", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "tue", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "tue", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "wed", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "wed", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "thu", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "thu", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "fri", "start": "08:00", "end": "22:00", "gender": "mixed"},
    ],
    "تکسان": [
        {"day": "sat", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "sat", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "sun", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "sun", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "mon", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "mon", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "tue", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "tue", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "wed", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "wed", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "thu", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "thu", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "fri", "start": "08:00", "end": "22:00", "gender": "mixed"},
    ],
}
OFFERS = [
    ("دسترسی ۱ ساعته", 500_000, 60),
    ("دسترسی ۳۰ دقیقه‌ای", 300_000, 30),
    ("کلاس گروهی", 350_000, 60),
    ("مربی خصوصی ۱ ساعته", 1_200_000, 60),
]

# Per-category offer templates
CATEGORY_OFFERS = {
    "gym": [
        ("دسترسی ۱ ساعته باشگاه", 500_000, 60),
        ("دسترسی ۳۰ دقیقه‌ای", 300_000, 30),
        ("کلاس گروهی بدنسازی", 350_000, 60),
        ("مربی خصوصی ۱ ساعته", 1_200_000, 60),
    ],
    "pool": [
        ("شنا ۱ ساعته", 600_000, 60),
        ("شنا + سونا", 800_000, 90),
        ("شنا + جکوزی", 700_000, 60),
        ("بلیط روزانه", 450_000, 120),
    ],
    "cinema": [
        ("بلیط سینما", 250_000, 120),
        ("بلیط سینما VIP", 500_000, 120),
    ],
    "yoga": [
        ("کلاس یوگا ۱ ساعته", 400_000, 60),
        ("کلاس مدیتیشن", 300_000, 45),
        ("پکیج ۴ جلسه‌ای", 1_400_000, 60),
    ],
    "sport": [
        ("رزرو زمین ۱ ساعته", 800_000, 60),
        ("رزرو زمین ۳۰ دقیقه‌ای", 450_000, 30),
    ],
}


class Command(BaseCommand):
    help = "Seed demo company, employees, gyms & offers"

    def handle(self, *args, **opts):
        # Create all categories
        categories = {}
        for slug, name_en, name_fa in [
            ("gym", "Gym", "بدنسازی"),
            ("pool", "Pool", "استخر"),
            ("cinema", "Cinema", "سینما"),
            ("yoga", "Yoga", "یوگا"),
            ("sport", "Sport", "ورزشگاه"),
        ]:
            cat, _ = Category.objects.get_or_create(slug=slug, defaults={"name_en": name_en, "name_fa": name_fa})
            categories[slug] = cat

        # demo company (matched by domain so re-running never creates a second one)
        company = Company.objects.filter(domain="demo.local").first()
        if company is None:
            company = Company.objects.create(
                name=DEMO_COMPANY_NAME, domain="demo.local", default_annual_budget=8_000_000,
                fiscal_year_start=date.today(), is_active=True, status=Company.Status.ACTIVE,
            )
        elif company.name == "Bagymo Demo Co.":
            company.name = DEMO_COMPANY_NAME
            company.save(update_fields=["name"])

        # users
        specs = [
            ("علی رضایی", "Ali", "09120000001", "a1111111", "male"),
            ("سارا محمدی", "Sara", "09120000002", "s2222222", "female"),
            ("رضا کریمی", "Reza", "09120000003", "r3333333", "male"),
        ]
        for n, old_name, phone, pw, gender in specs:
            u = User.objects.filter(phone_number=phone).first()
            if not u:
                u = User.objects.create_user(phone_number=phone, name=n, role=User.Role.USER,
                                             company=company, annual_budget=8_000_000,
                                             remaining_budget=8_000_000, fiscal_year_start=company.fiscal_year_start or date.today(),
                                             is_verified=True, is_active=True, gender=gender)
                u.set_password(pw)
                u.save()
            else:
                u.company = company
                u.is_active = True
                u.gender = gender
                if u.name == old_name:  # rename the old English demo names
                    u.name = n
                u.save()

        # company_admin
        ca = User.objects.filter(phone_number="09120000010").first()
        if not ca:
            ca = User.objects.create_user(phone_number="09120000010", name="مریم احمدی", role=User.Role.COMPANY_ADMIN,
                                          company=company, is_verified=True, is_active=True)
            ca.set_password("Admin12345")
            ca.save()
        else:
            ca.company = company
            ca.role = User.Role.COMPANY_ADMIN
            ca.is_active = True
            if ca.name == "HR Admin":
                ca.name = "مریم احمدی"
            ca.save()

        # platform admin (is_superuser for django admin panel)
        pa = User.objects.filter(phone_number="09120000000").first()
        if not pa:
            pa = User.objects.create_superuser(phone_number="09120000000", name="مدیر باجیمو",
                                               role=User.Role.ADMIN, is_verified=True, is_active=True)
            pa.set_password("Admin12345")
            pa.save()
        else:
            pa.role = User.Role.ADMIN
            if pa.name == "Platform Admin":
                pa.name = "مدیر باجیمو"
            pa.is_active = True
            pa.is_staff = True
            pa.is_superuser = True
            pa.save()

        # venues + offers
        for gm in SAMPLE_GYMS:
            cat = categories[gm["category"]]
            venue = Venue.objects.filter(name=gm["name"]).first()
            if not venue:
                venue = Venue.objects.create(
                    name=gm["name"], category=cat, address=gm["address"],
                    lat=gm["lat"], lng=gm["lng"], phone=gm["phone"],
                    district=gm["district"], city=gm["city"],
                    status=Venue.Status.ACTIVE, is_verified=True,
                    gender_policy=gm["gender_policy"],
                    description=gm.get("description", ""),
                )
            # category-specific offers
            offers_for_cat = CATEGORY_OFFERS.get(gm["category"], OFFERS)
            for oname, price, dur in offers_for_cat:
                offer = Offer.objects.filter(venue=venue, name=oname).first()
                if not offer:
                    Offer.objects.create(
                        venue=venue, name=oname, price=price,
                        venue_payout=int(price * Decimal("0.94")), duration_minutes=dur, is_active=True
                    )
            VenueCompanyAccess.objects.get_or_create(venue=venue, company=company, defaults={})
            # create gender slots
            for slot in GENDER_SLOTS.get(gm["name"], []):
                VenueGenderSlot.objects.get_or_create(
                    venue=venue, day_of_week=slot["day"],
                    start_time=slot["start"], end_time=slot["end"],
                    defaults={"gender": slot["gender"]},
                )
            # create timeslots for next 7 days
            today = date.today()
            for d in range(7):
                slot_date = today + timedelta(days=d)
                for start_h in [8, 10, 14, 16, 18]:
                    end_h = start_h + 2
                    for offer in Offer.objects.filter(venue=venue, is_active=True):
                        TimeSlot.objects.get_or_create(
                            offer=offer, date=slot_date,
                            start_time=time(start_h, 0), end_time=time(min(end_h, 22), 0),
                            defaults={"capacity": 10, "is_active": True},
                        )

        # venue staff - one per venue
        for i, venue in enumerate(Venue.objects.all(), start=1):
            phone = f"09120000{80 + i:03d}"
            user, created = User.objects.get_or_create(
                phone_number=phone,
                defaults={"name": f"{venue.name}", "role": User.Role.VENUE_STAFF, "venue": venue,
                          "is_verified": True, "is_active": True}
            )
            if not created:
                user.venue = venue
                user.role = User.Role.VENUE_STAFF
                user.save(update_fields=["venue", "role"])

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: company={company}, users={User.objects.filter(company=company).count()}, "
            f"venues={Venue.objects.count()}, offers={Offer.objects.count()}"
        ))

        # one demo booking (only on the first run, so re-seeding doesn't keep spending Ali's budget)
        ali = User.objects.get(phone_number="09120000001")
        offer = Offer.objects.first()
        if offer and not ali.bookings.exists():
            bal_before = ali.remaining_budget
            with transaction.atomic():
                booking = reserve_booking(ali, offer)
            bal_after = User.objects.get(pk=ali.pk).remaining_budget
            self.stdout.write(self.style.WARNING(
                f"Demo booking: {offer.name} @ {offer.price:,} -> budget "
                f"{bal_before:,} - {offer.price:,} = {bal_after:,} "
                f"| emp_commission={booking.employee_commission:,} "
                f"venue_commission={booking.venue_commission:,} "
                f"gym_gets={booking.venue_net_payout:,}"
            ))

        # Sample ratings
        ali = User.objects.get(phone_number="09120000001")
        sara = User.objects.get(phone_number="09120000002")
        venues = list(Venue.objects.filter(status="active"))
        if len(venues) >= 2:
            VenueRating.objects.get_or_create(venue=venues[0], user=ali, defaults={"score": 5, "comment": "عالی بود، حتماً دوباره می‌رم!"})
            VenueRating.objects.get_or_create(venue=venues[1], user=sara, defaults={"score": 4, "comment": "خوب بود ولی شلوغ بود"})
            VenueRating.objects.get_or_create(venue=venues[0], user=sara, defaults={"score": 4, "comment": "فضای خوبی دارد"})
            self.stdout.write(self.style.SUCCESS("Seeded sample ratings."))
