"""Billing Celery tasks (invoked by celery beat in later steps)."""
from datetime import date, timedelta

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from bookings.models import Booking  # noqa: F811
from catalog.models import Company

from .models import BudgetLedger, Invoice, SettlementBatch

User = get_user_model()


@shared_task
def aggregate_venue_settlement(venue_id, as_of):
    """Aggregate a venue's net payout for the day; create/update a SettlementBatch.

    `as_of` is an ISO date string (task args must be JSON-serializable).
    """
    if isinstance(as_of, str):
        as_of = date.fromisoformat(as_of)
    start = as_of - timedelta(days=1)
    qs = Booking.objects.filter(venue_id=venue_id, paid_at__date=as_of)
    total = sum((b.venue_net_payout for b in qs), 0)
    count = qs.count()
    SettlementBatch.objects.update_or_create(
        venue_id=venue_id, period_start=start, period_end=as_of,
        defaults={"total_net_payout": total, "total_count": count,
                  "status": SettlementBatch.Status.PENDING},
    )
    batch = SettlementBatch.objects.get(venue_id=venue_id, period_start=start, period_end=as_of)
    if batch.total_count > 0 and batch.total_net_payout >= settings.MIN_PAYOUT_TOMAN:
        batch.status = SettlementBatch.Status.PROCESSING
        batch.save(update_fields=["status"])
        initiate_venue_payout.delay(batch.id)
    return {"venue": venue_id, "count": count, "total": total}


@shared_task
def initiate_venue_payout(batch_id):
    """
    Step 6: real bank transfer via Sheba gateway goes here.
    Placeholder marks the batch PAID.
    """
    from .models import SettlementBatch
    try:
        batch = SettlementBatch.objects.get(id=batch_id)
        batch.status = SettlementBatch.Status.PAID
        batch.payment_ref = f"manual-{batch.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        batch.paid_at = timezone.now()
        batch.save(update_fields=["status", "payment_ref", "paid_at"])
    except Exception:  # noqa: BLE001
        SettlementBatch.objects.filter(id=batch_id).update(status=SettlementBatch.Status.FAILED)


@shared_task
def generate_monthly_company_invoices():
    """Roll up employee commissions per company for the previous month."""
    today = date.today()
    start = date(today.year, today.month, 1) - timedelta(days=1)
    start = date(start.year, start.month, 1)
    end = date(today.year, today.month, 1) - timedelta(days=1)
    for co in Company.objects.filter(is_active=True):
        rows = Booking.objects.filter(company=co, paid_at__date__gte=start, paid_at__date__lte=end)
        total_commission = sum((b.employee_commission for b in rows), 0)
        Invoice.objects.update_or_create(
            company=co, period_start=start, period_end=end,
            defaults={"total_toman": total_commission, "commission_total_toman": total_commission,
                      "due_date": today + timedelta(days=co.payment_terms_days),
                      "status": Invoice.Status.PENDING},
        )
    return {"invoices": True}


@shared_task
def reset_annual_budgets():
    """On fiscal rollover: refill remaining_budget and log a 'reset' ledger row."""
    today = date.today()
    affected = 0
    employees = User.objects.filter(role=User.Role.USER)
    for u in employees:
        if u.fiscal_year_start <= today - timedelta(days=360):  # due reset
            u.remaining_budget = u.annual_budget
            u.fiscal_year_start = today
            u.save(update_fields=["remaining_budget", "fiscal_year_start"])
            BudgetLedger.objects.create(
                employee=u, amount=u.annual_budget, type=BudgetLedger.Type.RESET,
                reference=f"reset:{today.year}", description="Annual budget reset",
            )
            affected += 1
    return {"reset": affected}
