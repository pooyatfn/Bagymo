"""
Tests for booking cancel flow: success, expired rejection, budget cap.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from bookings.models import Booking
from bookings.views import BookingViewSet
from billing.models import BudgetLedger
from billing.services import reserve_booking
from accounts.models import User
from catalog.models import Offer, VenueCompanyAccess


@pytest.fixture
def booking(employee, offer):
    return reserve_booking(employee, offer)


class TestCancelBooking:
    def test_cancel_success(self, employee, offer):
        """Cancelling a paid booking refunds budget."""
        booking = reserve_booking(employee, offer)
        bal_before = User.objects.get(pk=employee.pk).remaining_budget
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        assert response.status_code == 200
        assert response.data["ok"] is True
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == bal_before + booking.price

    def test_cancel_sets_status(self, employee, offer):
        booking = reserve_booking(employee, offer)
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        booking.refresh_from_db()
        assert booking.status == Booking.Status.CANCELLED
        assert booking.cancelled_at is not None

    def test_cancel_creates_ledger(self, employee, offer):
        booking = reserve_booking(employee, offer)
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        entry = BudgetLedger.objects.filter(employee=employee, type="refund").first()
        assert entry is not None
        assert entry.amount == booking.price

    def test_cancel_expired_booking_rejected(self, employee, offer):
        """Expired bookings cannot be cancelled."""
        booking = reserve_booking(employee, offer)
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        assert response.status_code == 400

    def test_cancel_already_cancelled_rejected(self, employee, offer):
        """Cannot cancel an already cancelled booking."""
        booking = reserve_booking(employee, offer)
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        assert response.status_code == 400

    def test_cancel_budget_capped_at_annual(self, employee, offer):
        """Refund should not push budget above annual_budget."""
        employee.remaining_budget = employee.annual_budget
        employee.save(update_fields=["remaining_budget"])
        booking = reserve_booking(employee, offer)
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == employee.annual_budget - offer.price
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=employee)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == employee.annual_budget

    def test_other_user_cannot_cancel(self, employee, offer, company):
        """Non-owner sees 404 (booking not in their queryset)."""
        from accounts.models import User
        other = User.objects.create_user(
            phone_number="0912999999", name="Other", role="employee",
            company=company, annual_budget=8_000_000, remaining_budget=8_000_000,
        )
        booking = reserve_booking(employee, offer)
        rf = APIRequestFactory()
        request = rf.post(f"/api/bookings/{booking.id}/cancel/")
        force_authenticate(request, user=other)
        view = BookingViewSet.as_view({"post": "cancel_booking"})
        response = view(request, pk=booking.id)
        assert response.status_code in (403, 404)
