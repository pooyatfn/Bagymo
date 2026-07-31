"""
Seed script for bagym MVP demo.
Creates: 1 company, 3 employees, 10 offers across 3 gyms, 1 venue staff,
and runs a demo booking to verify the commission math.
Run:  python manage.py seed_bagym
"""
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from catalog.models import Category, Company, Venue, Offer, VenueCompanyAccess
from billing.services import reserve_booking


SAMPLE_GYMS = [
    {"name": "Flex Gym Tehran", "address": "Valiasr St, Tehran", "lat": 35.6892, "lng": 51.3890, "phone": "021-91000001", "district": " مرکزی", "city": "Tehran", "gender_policy": "mixed"},
    {"name": "Champion Fitness", "address": "Niavaran, Tehran", "lat": 35.8123, "lng": 51.4478, "phone": "021-91000002", "district": "شمال", "city": "Tehran", "gender_policy": "male"},
    {"name": "BodySpace Arena", "address": "Mirdamad, Tehran", "lat": 35.7664, "lng": 51.4121, "phone": "021-91000003", "district": "میرداماد", "city": "Tehran", "gender_policy": "female"},
]
OFFERS = [
    ("1h gym access", 500_000, 60),
    ("30min gym", 300_000, 30),
    ("Group class", 350_000, 60),
    ("Personal trainer 1h", 1_200_000, 60),
]


class Command(BaseCommand):
    help = "Seed demo company, employees, gyms & offers"

    def handle(self, *args, **opts):
        cat, _ = Category.objects.get_or_create(
            slug="gym", defaults={"name_en": "Gym", "name_fa": "بدنسازی"}
        )
        company, _ = Company.objects.get_or_create(
            name="Bagym Demo Co.",
            defaults={"domain": "demo.local", "default_annual_budget": 8_000_000,
                      "fiscal_year_start": date.today(), "is_active": True},
        )

        # employees
        specs = [("Ali", "0912000001", "a1111111", "male"), ("Sara", "0912000002", "s2222222", "female"), ("Reza", "0912000003", "r3333333", "male")]
        for n, phone, pw, gender in specs:
            u = User.objects.filter(phone_number=phone).first()
            if not u:
                u = User.objects.create_user(phone_number=phone, name=n, role=User.Role.EMPLOYEE,
                                             company=company, annual_budget=8_000_000,
                                             remaining_budget=8_000_000, fiscal_year_start=company.fiscal_year_start or date.today(),
                                             is_verified=True, is_active=True, gender=gender)
                u.set_password(pw)
                u.save()
            else:
                u.company = company; u.is_active=True; u.gender = gender
                u.save()

        # gyms + offers
        for gm in SAMPLE_GYMS:
            venue = Venue.objects.filter(name=gm["name"]).first()
            if not venue:
                venue = Venue.objects.create(
                    name=gm["name"], category=cat, address=gm["address"],
                    lat=gm["lat"], lng=gm["lng"], phone=gm["phone"],
                    district=gm["district"], city=gm["city"],
                    status=Venue.Status.ACTIVE, is_verified=True,
                    gender_policy=gm["gender_policy"],
                )
            for oname, price, dur in OFFERS:
                offer = Offer.objects.filter(venue=venue, name=oname).first()
                if not offer:
                    Offer.objects.create(
                        venue=venue, name=oname, price=price,
                        venue_payout=int(price * Decimal("0.94")), duration_minutes=dur, is_active=True
                    )
            VenueCompanyAccess.objects.get_or_create(venue=venue, company=company, defaults={})

        # venue staff
        v = Venue.objects.first()
        User.objects.get_or_create(
            phone_number="0912000009",
            defaults={"name": "Gym Staff", "role": User.Role.VENUE_STAFF, "venue": v,
                      "is_verified": True, "is_active": True}
        )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: company={company}, employees={User.objects.filter(company=company).count()}, "
            f"venues={Venue.objects.count()}, offers={Offer.objects.count()}"
        ))

        # demo booking verifying commission math
        ali = User.objects.get(phone_number="0912000001")
        offer = Offer.objects.first()
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
