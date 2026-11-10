"""Catalog background tasks (run by the Celery worker, scheduled by celery beat)."""
import logging
from io import StringIO

from celery import shared_task
from django.conf import settings
from django.core.management import CommandError, call_command

logger = logging.getLogger(__name__)



@shared_task(name="catalog.sync_venues")
def sync_venues_task(cities=None, grid=None, spacing_km=None):
    """
    Refresh venues from Neshan for each city in
    VENUE_SYNC_CITIES. Scheduled nightly; can also be queued by hand:
        sync_venues_task.delay(cities=["tehran", "karaj"])
    Returns {city: summary-line or error}.
    """
    if not settings.NESHAN_API_KEY:
        logger.warning("Venue sync skipped: NESHAN_API_KEY is not set.")
        return {"skipped": "NESHAN_API_KEY is not set"}

    results = {}
    for city in cities or settings.VENUE_SYNC_CITIES:
        out = StringIO()
        try:
            call_command(
                "sync_neshan_venues",
                city=city,
                grid=grid or settings.VENUE_SYNC_GRID,
                spacing_km=spacing_km or settings.VENUE_SYNC_SPACING_KM,
                stdout=out,
            )
            summary = next((ln for ln in out.getvalue().splitlines() if ln.startswith("Done.")), "Done.")
            results[city] = summary
            logger.info("Venue sync %s: %s", city, summary)
        except CommandError as exc:
            # a bad key / rate limit affects every city — stop early
            results[city] = f"error: {exc}"
            logger.error("Venue sync %s failed: %s", city, exc)
            break
    return results
