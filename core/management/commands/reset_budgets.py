"""
Manual budget reset trigger for employees whose fiscal year has rolled over.
Usage:  python manage.py reset_budgets
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from billing.models import BudgetLedger


class Command(BaseCommand):
    help = "Reset remaining_budget for employees whose fiscal year is due"

    def handle(self, *args, **kwargs):
        today = date.today()
        affected = 0
        with transaction.atomic():
            for u in User.objects.select_for_update().filter(role="employee", is_active=True):
                if u.fiscal_year_start is None:
                    continue
                # fiscal year rolls over if today is >= start + 1 year
                next_reset = u.fiscal_year_start.replace(year=u.fiscal_year_start.year + 1)
                if today >= next_reset:
                    old = u.remaining_budget
                    u.remaining_budget = u.annual_budget
                    u.fiscal_year_start = next_reset
                    u.save(update_fields=["remaining_budget", "fiscal_year_start", "updated_at"])
                    BudgetLedger.objects.create(
                        employee=u, amount=u.annual_budget, type=BudgetLedger.Type.RESET,
                        reference=f"reset:{today.year}",
                        description=f"Annual budget reset from {old:,} to {u.annual_budget:,}",
                    )
                    affected += 1
        self.stdout.write(self.style.SUCCESS(f"Reset {affected} employees"))
