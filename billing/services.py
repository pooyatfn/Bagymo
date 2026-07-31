"""
billing/services.py
Canonical money logic (Step 3). All prices are immutable snapshots at booking time.

Formulas (locked business model):
  employee_commission = price × c_emp        (reserved FROM employee budget)
  venue_gross         = price × (1 − c_emp)  (what venue is entitled to before their commission)
  venue_commission    = venue_gross × c_venue (reserved FROM venue payout)
  venue_net_payout    = venue_gross − venue_commission
  platform margin      = employee_commission + venue_commission = price − venue_net_payout
"""
from decimal import ROUND_HALF_UP, Decimal
from django.conf import settings
from django.db import models as django_models, transaction
from django.utils import timezone
from django.core.cache import cache

from bookings.models import Booking
from billing.models import BudgetLedger, SettlementBatch
from catalog.models import VenueCompanyAccess

TOMAN = Decimal("1")


def _q(value):
    """Round a Decimal money value to integer Toman, half-up."""
    return int((value).quantize(TOMAN, rounding=ROUND_HALF_UP))


def commission_split(price, c_emp, c_venue):
    """
    Flat two-sided commission model (user's spec).
      employee_commission = price * c_emp        (reserved FROM employee budget)
      venue_gross_payout  = price - employee_commission (venue's entitlement pre-cut)
      venue_commission    = price * c_venue       (reserved FROM venue payout)
      venue_net_payout     = venue_gross - venue_commission
      platform margin      = employee_commission + venue_commission
    """
    price = Decimal(price)
    emp_c = price * Decimal(str(c_emp))
    venue_gross = price - emp_c
    venue_c = price * Decimal(str(c_venue))  # flat % of reservation price
    venue_net = venue_gross - venue_c
    return {
        "employee_commission": _q(emp_c),
        "venue_gross_payout": _q(venue_gross),
        "venue_commission": _q(venue_c),
        "venue_net_payout": _q(venue_net),
    }


def _generate_checkin_code():
    import secrets
    return secrets.token_urlsafe(6).upper().replace("-", "")[:10]


def reserve_booking(employee, offer, timeslot=None):
    """
    Atomically create a Booking + debit employee budget.
    Raises InsufficientBudget, GeoError, etc.
    """
    if not employee.remaining_budget:
        raise InsufficientBudget("Employee has no budget.")

    if offer.price > employee.remaining_budget:
        raise InsufficientBudget(
            f"Offer costs {offer.price:,} but only {employee.remaining_budget:,} budget remains."
        )

    c_emp = employee.effective_commission_pct_emp()
    c_venue = employee.effective_commission_pct_venue()
    split = commission_split(offer.price, c_emp, c_venue)

    # per-company negotiated payout override (VenueCompanyAccess)
    venue_net = split["venue_net_payout"]
    if employee.company_id:
        try:
            access = VenueCompanyAccess.objects.get(venue=offer.venue, company=employee.company, is_active=True)
            if access.payout_override_toman is not None:
                venue_net = access.payout_override_toman
        except VenueCompanyAccess.DoesNotExist:
            pass

    with transaction.atomic():
        # lock the budget row to prevent double-spend
        employee = (
            type(employee)
            .objects
            .select_for_update(of=("remaining_budget",))
            .get(pk=employee.pk)
        )
        if employee.remaining_budget < offer.price:
            raise InsufficientBudget("Budget changed during reservation.")
        employee.remaining_budget = employee.remaining_budget - offer.price
        employee.save(update_fields=["remaining_budget", "updated_at"])

        BudgetLedger.objects.create(
            employee=employee,
            amount=-offer.price,
            type=BudgetLedger.Type.DEBIT,
            reference=f"bookings:{offer.id}",
            description=f"Booking reserved: {offer.venue.name} / {offer.name}",
        )

        ttl_minutes = settings.RESERVATION_TTL_MINUTES
        expires_at = timezone.now() + timezone.timedelta(minutes=ttl_minutes)
        booking = Booking.objects.create(
            employee=employee,
            venue=offer.venue,
            offer=offer,
            company=employee.company,
            timeslot=timeslot,
            price=offer.price,
            employee_commission=split["employee_commission"],
            venue_gross_payout=split["venue_gross_payout"],
            venue_commission=split["venue_commission"],
            venue_net_payout=venue_net,
            status=Booking.Status.PAID,  # budget already debited at reservation
            paid_at=timezone.now(),
            expires_at=expires_at,
            check_in_code=_generate_checkin_code(),
        )
        # decrement timeslot capacity
        if timeslot:
            from catalog.models import TimeSlot
            TimeSlot.objects.filter(pk=timeslot.pk).update(
                booked_count=django_models.F("booked_count") + 1
            )
        # cache the code→booking for fast staff verify (QR/scanner)
        cache.set(f"checkin:{booking.check_in_code}", booking.id, timeout=ttl_minutes * 120)

        # send booking confirmation SMS
        from core.sms import send_booking_confirmation
        send_booking_confirmation(
            employee.phone_number,
            offer.venue.name,
            offer.name,
            booking.check_in_code,
        )

        return booking


class InsufficientBudget(Exception):
    pass


def mark_checked_in(booking, code, staff_code, request):
    """
    Verify a booking via numeric/QR code at the venue. Marks CHECKED_IN.
    Returns (bool ok, str message).
    """
    if booking.status != Booking.Status.PAID:
        return False, f"Booking cannot be checked in (status={booking.status})."
    if booking.expires_at < timezone.now():
        booking.status = Booking.Status.EXPIRED
        booking.save(update_fields=["status", "completed_at"])
        return False, "Reservation expired."
    if code is None or str(code) != booking.check_in_code:
        return False, "Check-in code mismatch."

    # geo fence (best-effort; staff enters coords or app sends)
    lat = request.data.get("lat")
    lng = request.data.get("lng")
    geo_ok = True
    if lat and lng:
        try:
            vlat = booking.venue.lat
            vlng = booking.venue.lng
            if vlat is not None and vlng is not None:
                import math
                R = 6371000.0
                dlat = math.radians(float(lat) - vlat)
                dlng = math.radians(float(lng) - vlng)
                a = math.sin(dlat/2)**2 + math.cos(math.radians(vlat)) * math.cos(math.radians(float(lat))) * math.sin(dlng/2)**2
                d = 2 * R * math.asin(math.sqrt(a))
                geo_ok = d <= 100  # 100m fence
            booking.geo_verified = geo_ok
        except Exception:
            geo_ok = False
    else:
        geo_ok = True

    if not geo_ok:
        return False, "Check-in rejected: outside venue geofence."

    if staff_code and not staff_code.strip().lower().startswith("skip"):
        booking.staff_code = staff_code
    booking.status = Booking.Status.CHECKED_IN
    booking.checked_in_at = timezone.now()
    booking.save(update_fields=["status", "checked_in_at", "staff_code", "geo_verified"])

    # send check-in confirmation SMS
    from core.sms import send_checkin_confirmation
    send_checkin_confirmation(booking.employee.phone_number, booking.venue.name)

    # queue settlement aggregation
    from billing.tasks import aggregate_venue_settlement
    aggregate_venue_settlement.delay(booking.venue_id, timezone.now().date())
    return True, "Checked in."
