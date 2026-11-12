"""Venue settlement: aggregates a venue's daily net payout into a SettlementBatch."""
from datetime import date, timedelta

from django.conf import settings
from django.utils import timezone

from bookings.models import Booking  # noqa: F811

from .models import SettlementBatch


def aggregate_venue_settlement(venue_id, as_of):
    """Aggregate a venue's net payout for the day; create/update a SettlementBatch.

    `as_of` is an ISO date string .
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
        initiate_venue_payout(batch.id)
    return {"venue": venue_id, "count": count, "total": total}


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
