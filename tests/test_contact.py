"""Public contact form."""
import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from core.models import ContactMessage
from core.views import CONTACT_LIMIT

PAYLOAD = {"name": "سارا", "contact": "09120000000", "topic": "company", "message": "می‌خواهیم سازمان‌مان را ثبت کنیم."}


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()


@pytest.mark.django_db
def test_contact_message_is_stored_without_login():
    r = APIClient().post("/api/contact/", PAYLOAD, format="json")
    assert r.status_code == 201
    m = ContactMessage.objects.get()
    assert m.topic == "company" and not m.is_handled


@pytest.mark.django_db
def test_contact_rejects_short_message():
    r = APIClient().post("/api/contact/", {**PAYLOAD, "message": "سلام"}, format="json")
    assert r.status_code == 400 and ContactMessage.objects.count() == 0


@pytest.mark.django_db
def test_contact_is_rate_limited():
    client = APIClient()
    for _ in range(CONTACT_LIMIT):
        assert client.post("/api/contact/", PAYLOAD, format="json").status_code == 201
    assert client.post("/api/contact/", PAYLOAD, format="json").status_code == 429
