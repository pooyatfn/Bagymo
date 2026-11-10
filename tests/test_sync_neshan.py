"""Venue import from Neshan and the nightly sync task."""
from io import StringIO
from unittest.mock import MagicMock, patch

import pytest
from django.core.management import CommandError, call_command

from catalog.management.commands import sync_neshan_venues as neshan_cmd
from catalog.models import Venue
from catalog.venue_sync import grid_points


# --- Neshan ---------------------------------------------------------------
def n_item(title, lat, lng, address="خیابان ولیعصر", neighbourhood="ونک"):
    return {"title": title, "address": address, "neighbourhood": neighbourhood, "location": {"x": lng, "y": lat}}


@pytest.fixture
def neshan(settings):
    settings.NESHAN_API_KEY = "service.test"
    results: dict[str, list] = {}

    def fake_search(self, term, lat, lng):
        self.requests += 1
        return results.get(term, [])

    with patch.object(neshan_cmd.NeshanClient, "search", fake_search):
        yield results


def run(command, *args):
    out = StringIO()
    call_command(command, "--grid", "1", "--delay", "0", *args, stdout=out)
    return out.getvalue()


@pytest.mark.django_db
def test_neshan_requires_api_key(settings):
    settings.NESHAN_API_KEY = ""
    with pytest.raises(CommandError):
        call_command("sync_neshan_venues")


@pytest.mark.django_db
def test_neshan_creates_pending_venues_and_filters_noise(neshan):
    neshan["باشگاه بدنسازی"] = [n_item("باشگاه بدنسازی آرمان", 35.75, 51.41), n_item("خیابان باشگاه", 35.70, 51.40)]
    neshan["باشگاه ورزشی"] = [n_item("باشگاه بدنسازی آرمان", 35.75, 51.41)]
    run("sync_neshan_venues", "--category", "gym")
    v = Venue.objects.get()
    assert v.name == "باشگاه بدنسازی آرمان" and v.status == "pending" and v.source == "neshan"


@pytest.mark.django_db
def test_rerun_refreshes_pending_but_not_approved(neshan):
    neshan["سینما"] = [n_item("سینما آزادی", 35.72, 51.42, address="الف")]
    run("sync_neshan_venues", "--category", "cinema")
    neshan["سینما"] = [n_item("سینما آزادی", 35.72, 51.42, address="ب")]
    run("sync_neshan_venues", "--category", "cinema")
    assert Venue.objects.get().address == "ب"
    Venue.objects.update(status="active", address="ویرایش مدیر")
    neshan["سینما"] = [n_item("سینما آزادی", 35.72, 51.42, address="ج")]
    run("sync_neshan_venues", "--category", "cinema")
    v = Venue.objects.get()
    assert v.address == "ویرایش مدیر" and v.synced_at is not None


@pytest.mark.django_db
def test_skips_venue_that_already_signed_up(neshan, category):
    Venue.objects.create(name="باشگاه بدنسازی آرمان", category=category, lat=35.7500, lng=51.4100, status="active")
    neshan["باشگاه بدنسازی"] = [n_item("باشگاه بدنسازي آرمان", 35.7505, 51.4102)]
    run("sync_neshan_venues", "--category", "gym")
    assert Venue.objects.count() == 1


@pytest.mark.django_db
def test_dry_run_saves_nothing(neshan):
    neshan["یوگا"] = [n_item("یوگا سلامت", 35.70, 51.35)]
    assert "یوگا سلامت" in run("sync_neshan_venues", "--category", "yoga", "--dry-run")
    assert Venue.objects.count() == 0


def test_grid_points_count_and_center():
    pts = grid_points(35.7, 51.4, 3, 6)
    assert len(pts) == 9 and pts[4] == pytest.approx((35.7, 51.4))


# --- nightly task -----------------------------------------------------------
@pytest.mark.django_db
def test_task_skips_without_key(settings):
    from catalog.tasks import sync_venues_task

    settings.NESHAN_API_KEY = ""
    assert "skipped" in sync_venues_task()


@pytest.mark.django_db
def test_task_runs_each_configured_city(neshan, settings):
    from catalog.tasks import sync_venues_task

    settings.VENUE_SYNC_CITIES = ["tehran", "karaj"]
    settings.VENUE_SYNC_GRID = 1
    neshan["سینما"] = [n_item("سینما آزادی", 35.72, 51.42)]
    result = sync_venues_task()
    assert set(result) == {"tehran", "karaj"} and all(v.startswith("Done.") for v in result.values())


def test_neshan_service_not_enabled_is_explained():
    resp = MagicMock(status_code=485, text="ApiServiceListError")
    client = neshan_cmd.NeshanClient("k", "https://api.neshan.org/", delay=0)
    with patch.object(client.session, "get", return_value=resp), pytest.raises(CommandError) as exc:
        client.search("سینما", 35.7, 51.4)
    assert "تیکت" in str(exc.value)


def test_neshan_v3_request_and_non_place_items():
    resp = MagicMock(status_code=200)
    resp.json.return_value = {"items": [n_item("سینما آزادی", 35.72, 51.42), {**n_item("خیابان سینما", 35.7, 51.4), "category": "municipal"}]}
    client = neshan_cmd.NeshanClient("k", "https://api.neshan.org/", delay=0)
    with patch.object(client.session, "get", return_value=resp) as get:
        places = client.discover("cinema", 35.7, 51.4, 1000)
    assert get.call_args.args[0] == "https://api.neshan.org/v3/search"
    assert '"latitude": 35.7' in get.call_args.kwargs["params"]["q"]
    assert {p.title for p in places} == {"سینما آزادی"}


def test_nightly_schedule_registered():
    from django.conf import settings

    assert settings.CELERY_BEAT_SCHEDULE["sync-venues-nightly"]["task"] == "catalog.sync_venues"
