"""
Tests for auto-expiry of past bookings.
"""
from datetime import timedelta

from django.utils import timezone

from accounts.models import User
from billing.models import BudgetLedger
from billing.services import reserve_booking
from bookings.models import Booking
from bookings.views import _expire_past_bookings


class TestAutoExpiry:
    def test_expires_past_bookings(self, employee, offer):
        """Bookings past expires_at get expired."""
        booking = reserve_booking(employee, offer)
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        booking.refresh_from_db()
        assert booking.status == Booking.Status.EXPIRED

    def test_expiry_refunds_budget(self, employee, offer):
        """Expiring refunds budget capped at annual_budget."""
        booking = reserve_booking(employee, offer)
        bal_after_book = User.objects.get(pk=employee.pk).remaining_budget
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == bal_after_book + booking.price

    def test_expiry_creates_ledger(self, employee, offer):
        """Expiring creates a REFUND ledger entry."""
        booking = reserve_booking(employee, offer)
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        entry = BudgetLedger.objects.filter(employee=employee, type="refund").first()
        assert entry is not None
        assert entry.amount == booking.price

    def test_does_not_expire_active_bookings(self, employee, offer):
        """Bookings not yet expired are not touched."""
        booking = reserve_booking(employee, offer)
        booking.expires_at = timezone.now() + timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        booking.refresh_from_db()
        assert booking.status == Booking.Status.PAID

    def test_does_not_expire_cancelled_bookings(self, employee, offer):
        """Cancelled bookings past expiry are not expired again."""
        booking = reserve_booking(employee, offer)
        booking.status = Booking.Status.CANCELLED
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["status", "expires_at"])
        _expire_past_bookings()
        booking.refresh_from_db()
        assert booking.status == Booking.Status.CANCELLED

    def test_expiry_budget_capped_at_annual(self, employee, offer):
        """Expiry refund does not push budget above annual_budget."""
        employee.remaining_budget = employee.annual_budget
        employee.save(update_fields=["remaining_budget"])
        booking = reserve_booking(employee, offer)
        booking.expires_at = timezone.now() - timedelta(hours=1)
        booking.save(update_fields=["expires_at"])
        _expire_past_bookings()
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == employee.annual_budget
