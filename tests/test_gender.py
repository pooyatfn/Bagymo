"""
Tests for gender-based venue filtering and booking validation.
"""
from datetime import time

import pytest

from billing.services import reserve_booking
from catalog.models import Offer, Venue, VenueCompanyAccess, VenueGenderSlot


class TestGenderFiltering:
    def test_male_employee_can_book_male_venue(self, male_employee, male_only_venue, company):
        VenueCompanyAccess.objects.create(venue=male_only_venue, company=company)
        offer = Offer.objects.create(
            venue=male_only_venue, name="gym", price=500_000,
            venue_payout=470_000, duration_minutes=60, is_active=True
        )
        booking = reserve_booking(male_employee, offer)
        assert booking.status == "paid"

    def test_female_employee_rejected_at_male_venue(self, female_employee, male_only_venue, company):
        from rest_framework.test import APIRequestFactory

        from bookings.serializers import BookingCreateSerializer
        VenueCompanyAccess.objects.create(venue=male_only_venue, company=company)
        offer = Offer.objects.create(
            venue=male_only_venue, name="gym", price=500_000,
            venue_payout=470_000, duration_minutes=60, is_active=True
        )
        rf = APIRequestFactory()
        request = rf.post("/api/bookings/", {"offer_id": offer.id})
        request.user = female_employee
        ser = BookingCreateSerializer(data={"offer_id": offer.id}, context={"request": request})
        with pytest.raises(Exception) as exc_info:
            ser.is_valid(raise_exception=True)
        assert "بانوان" in str(exc_info.value) or "آقایان" in str(exc_info.value)

    def test_male_employee_rejected_at_female_venue(self, male_employee, female_only_venue, company):
        from rest_framework.test import APIRequestFactory

        from bookings.serializers import BookingCreateSerializer
        VenueCompanyAccess.objects.create(venue=female_only_venue, company=company)
        offer = Offer.objects.create(
            venue=female_only_venue, name="gym", price=500_000,
            venue_payout=470_000, duration_minutes=60, is_active=True
        )
        rf = APIRequestFactory()
        request = rf.post("/api/bookings/", {"offer_id": offer.id})
        request.user = male_employee
        ser = BookingCreateSerializer(data={"offer_id": offer.id}, context={"request": request})
        with pytest.raises(Exception) as exc_info:
            ser.is_valid(raise_exception=True)
        assert "بانوان" in str(exc_info.value)

    def test_anyone_can_book_mixed_venue(self, male_employee, female_employee, mixed_venue, company):
        VenueCompanyAccess.objects.create(venue=mixed_venue, company=company)
        offer = Offer.objects.create(
            venue=mixed_venue, name="gym", price=500_000,
            venue_payout=470_000, duration_minutes=60, is_active=True
        )
        b1 = reserve_booking(male_employee, offer)
        assert b1.status == "paid"
        b2 = reserve_booking(female_employee, offer)
        assert b2.status == "paid"

    def test_employee_without_gender_can_book(self, employee, male_only_venue, company):
        """Employee with no gender set can book anywhere."""
        assert employee.gender is None
        VenueCompanyAccess.objects.create(venue=male_only_venue, company=company)
        offer = Offer.objects.create(
            venue=male_only_venue, name="gym", price=500_000,
            venue_payout=470_000, duration_minutes=60, is_active=True
        )
        booking = reserve_booking(employee, offer)
        assert booking.status == "paid"


class TestGenderTimeSlots:
    def test_gender_for_now_uses_slot(self, db, category):
        """gender_for_now() returns slot gender when active."""
        venue = Venue.objects.create(
            name="TimedGym", category=category, address="Tehran",
            lat=35.68, lng=51.38, status="active", is_verified=True,
            gender_policy="mixed"
        )
        from django.utils import timezone
        now = timezone.now()
        day_map = {0: "sat", 1: "sun", 2: "mon", 3: "tue", 4: "wed", 5: "thu", 6: "fri"}
        today = day_map[now.weekday()]
        VenueGenderSlot.objects.create(
            venue=venue, day_of_week=today,
            start_time=time(0, 0), end_time=time(23, 59), gender="male"
        )
        assert venue.gender_for_now() == "male"

    def test_gender_for_now_falls_back_to_static(self, db, category):
        """Without a matching slot, falls back to static gender_policy."""
        venue = Venue.objects.create(
            name="StaticGym", category=category, address="Tehran",
            lat=35.68, lng=51.38, status="active", is_verified=True,
            gender_policy="female"
        )
        assert venue.gender_for_now() == "female"
