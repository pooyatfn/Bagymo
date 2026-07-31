from django.conf import settings
from django.db import models

from catalog.models import Venue, Offer, Company


class Booking(models.Model):
    """
    Reservation + check-in record.
    Lifecycle: reserved -> paid -> checkedin -> completed
                  |-> cancelled | expired
    """
    class Status:
        RESERVED = "reserved"
        PAID = "paid"
        CHECKED_IN = "checkedin"
        COMPLETED = "completed"
        CANCELLED = "cancelled"
        EXPIRED = "expired"
        CHOICES = [
            (RESERVED, "Reserved"),
            (PAID, "Paid"),
            (CHECKED_IN, "Checked In"),
            (COMPLETED, "Completed"),
            (CANCELLED, "Cancelled"),
            (EXPIRED, "Expired"),
        ]

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="bookings"
    )
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name="bookings")
    offer = models.ForeignKey(Offer, on_delete=models.PROTECT, related_name="bookings")
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="bookings")

    # prices at booking time (immutable snapshot)
    price = models.PositiveIntegerField()
    employee_commission = models.PositiveIntegerField()
    venue_gross_payout = models.PositiveIntegerField()
    venue_commission = models.PositiveIntegerField()
    venue_net_payout = models.PositiveIntegerField()

    status = models.CharField(max_length=16, choices=Status.CHOICES, default=Status.RESERVED)
    reserved_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    check_in_code = models.CharField(max_length=12, unique=True)

    device_id = models.CharField(max_length=64, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    geo_verified = models.BooleanField(default=False)
    staff_code = models.CharField(max_length=12, null=True, blank=True)

    class Meta:
        db_table = "bookings_booking"
        indexes = [models.Index(fields=["-reserved_at"])]

    def __str__(self) -> str:
        return f"Booking {self.check_in_code} {self.status}"
