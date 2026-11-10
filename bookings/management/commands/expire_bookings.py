from django.core.management.base import BaseCommand
from django.utils import timezone

from billing.models import BudgetLedger
from bookings.models import Booking


class Command(BaseCommand):
    help = "Expire bookings past their expires_at time and refund budgets"

    def handle(self, *args, **options):
        now = timezone.now()
        expired = Booking.objects.filter(
            expires_at__lt=now,
            status__in=[Booking.Status.RESERVED, Booking.Status.PAID],
        )
        count = 0
        for booking in expired:
            booking.status = Booking.Status.EXPIRED
            booking.save(update_fields=["status"])
            # refund budget capped at annual_budget
            employee = booking.employee
            employee = type(employee).objects.select_for_update().get(pk=employee.pk)
            employee.remaining_budget = min(
                employee.remaining_budget + booking.price,
                employee.annual_budget,
            )
            employee.save(update_fields=["remaining_budget"])
            BudgetLedger.objects.create(
                employee=employee,
                amount=booking.price,
                type=BudgetLedger.Type.REFUND,
                reference=f"bookings:{booking.id}",
                description=f"Booking expired: {booking.offer.name}",
            )
            count += 1
        self.stdout.write(f"Expired {count} bookings")
