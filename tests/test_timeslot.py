"""
Tests for timeslot booking: capacity tracking, restore on cancel.
"""
import pytest
from datetime import timedelta
from rest_framework.test import APIRequestFactory, force_authenticate
from catalog.models import TimeSlot
from bookings.models import Booking
from bookings.views import BookingViewSet
from billing.services import reserve_booking


class TestTimeslotBooking:
    def test_booking_with_timeslot(self, employee, offer, timeslot):
        """Booking with timeslot decrements booked_count."""
        assert timeslot.booked_count == 0
        booking = reserve_booking(employee, offer, timeslot=timeslot)
        assert booking.timeslot_id == timeslot.id
        timeslot.refresh_from_db()
        assert timeslot.booked_count == 1

    def test_booking_without_timeslot(self, employee, offer):
        """Booking without timeslot works (timeslot is optional)."""
        booking = reserve_booking(employee, offer, timeslot=None)
        assert booking.timeslot_id is None

    def test_timeslot_capacity_enforced(self, employee, offer, timeslot, company):
        """Cannot book a full timeslot."""
        from catalog.models import VenueCompanyAccess
        from bookings.serializers import BookingCreateSerializer
        VenueCompanyAccess.objects.create(venue=offer.venue, company=company)
        timeslot.capacity = 1
        timeslot.booked_count = 1
        timeslot.save(update_fields=["capacity", "booked_count"])
        rf = APIRequestFactory()
        request = rf.post("/api/bookings/", {"offer_id": offer.id, "timeslot_id": timeslot.id})
        request.user = employee
        ser = BookingCreateSerializer(
            data={"offer_id": offer.id, "timeslot_id": timeslot.id},
            context={"request": request}
        )
        with pytest.raises(Exception) as exc_info:
            ser.is_valid(raise_exception=True)
        assert "ظرفیت" in str(exc_info.value) or "timeslot_id" in str(exc_info.value)

    def test_cancel_restores_timeslot_capacity(self, employee, offer, timeslot):
        """Cancelling a booking with timeslot restores booked_count."""
        booking = reserve_booking(employee, offer, timeslot=timeslot)
        timeslot.refresh_from_db()
        assert timeslot.booked_count == 1
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        assert response.status_code == 200
        timeslot.refresh_from_db()
        assert timeslot.booked_count == 0

    def test_expire_restores_timeslot_capacity(self, employee, offer, timeslot):
        """Expiring a booking with timeslot restores booked_count."""
        from django.utils import timezone
        from bookings.views import _expire_past_bookings
        booking = reserve_booking(employee, offer, timeslot=timeslot)
        timeslot.refresh_from_db()
        assert timeslot.booked_count == 1
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        timeslot.refresh_from_db()
        assert timeslot.booked_count == 0
