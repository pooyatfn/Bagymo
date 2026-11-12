"""
Generate last month's company invoices (employee commissions per company).
Usage:  python manage.py generate_invoices
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from billing.models import Invoice
from bookings.models import Booking
from catalog.models import Company


class Command(BaseCommand):
    help = "Roll up employee commissions per company for the previous month"

    def handle(self, *args, **kwargs):
        today = date.today()
        end = date(today.year, today.month, 1) - timedelta(days=1)
        start = date(end.year, end.month, 1)
        count = 0
        for co in Company.objects.filter(is_active=True):
            rows = Booking.objects.filter(company=co, paid_at__date__gte=start, paid_at__date__lte=end)
            total_commission = sum((b.employee_commission for b in rows), 0)
            Invoice.objects.update_or_create(
                company=co, period_start=start, period_end=end,
                defaults={"total_toman": total_commission, "commission_total_toman": total_commission,
                          "due_date": today + timedelta(days=co.payment_terms_days),
                          "status": Invoice.Status.PENDING},
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f"{count} invoices for {start} – {end}"))
