"""
Tests for venue ratings and offer edit/delete.
"""

import pytest

from accounts.models import User
from billing.services import reserve_booking
from catalog.models import Offer, Venue, VenueRating


@pytest.fixture
def venue_staff(db, venue):
    return User.objects.create_user(
        phone_number="0912555555", name="Staff1", role="venue_staff",
        venue=venue, is_verified=True
    )


class TestOfferEditDelete:
    def test_edit_offer(self, venue_staff, offer):
        """Venue staff can edit their own offer."""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=venue_staff)
        res = client.patch(f"/api/catalog/venue-offers/{offer.id}/", {
            "name": "Updated Offer",
            "price": 600_000,
            "venue_payout": 564_000,
        }, format="json")
        assert res.status_code == 200
        offer.refresh_from_db()
        assert offer.name == "Updated Offer"
        assert offer.price == 600_000

    def test_delete_offer(self, venue_staff, offer):
        """Venue staff can delete an offer with no active bookings."""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=venue_staff)
        res = client.delete(f"/api/catalog/venue-offers/{offer.id}/")
        assert res.status_code == 204
        assert not Offer.objects.filter(id=offer.id).exists()

    def test_cannot_edit_other_venues_offer(self, venue_staff, venue, category):
        """Venue staff cannot edit offers belonging to another venue."""
        from rest_framework.test import APIClient
        other_venue = Venue.objects.create(
            name="OtherGym", category=category, status="active", is_verified=True
        )
        other_offer = Offer.objects.create(
            venue=other_venue, name="Other", price=100_000,
            venue_payout=94_000, duration_minutes=60
        )
        client = APIClient()
        client.force_authenticate(user=venue_staff)
        res = client.patch(f"/api/catalog/venue-offers/{other_offer.id}/", {
            "name": "Hacked"
        }, format="json")
        assert res.status_code == 404


class TestVenueRating:
    def test_rate_venue_after_booking(self, employee, venue, offer):
        """Employee can rate a venue after a checked-in booking."""
        from rest_framework.test import APIClient
        booking = reserve_booking(employee, offer)
        booking.status = "checked_in"
        booking.save(update_fields=["status"])

        client = APIClient()
        client.force_authenticate(user=employee)
        res = client.post(f"/api/catalog/venues/{venue.id}/rate/", {
            "score": 5, "comment": "Great!"
        }, format="json")
        assert res.status_code == 201
        assert VenueRating.objects.filter(venue=venue, user=employee).exists()

    def test_cannot_rate_without_booking(self, employee, venue):
        """Employee cannot rate a venue without a completed booking."""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=employee)
        res = client.post(f"/api/catalog/venues/{venue.id}/rate/", {
            "score": 5
        }, format="json")
        assert res.status_code == 400

    def test_update_rating(self, employee, venue, offer):
        """Employee can update their existing rating."""
        from rest_framework.test import APIClient
        booking = reserve_booking(employee, offer)
        booking.status = "checked_in"
        booking.save(update_fields=["status"])

        client = APIClient()
        client.force_authenticate(user=employee)
        client.post(f"/api/catalog/venues/{venue.id}/rate/", {"score": 4}, format="json")
        res = client.post(f"/api/catalog/venues/{venue.id}/rate/", {"score": 5, "comment": "Even better!"}, format="json")
        assert res.status_code == 200
        rating = VenueRating.objects.get(venue=venue, user=employee)
        assert rating.score == 5
        assert rating.comment == "Even better!"

    def test_invalid_score(self, employee, venue, offer):
        """Rating with invalid score is rejected."""
        from rest_framework.test import APIClient
        booking = reserve_booking(employee, offer)
        booking.status = "checked_in"
        booking.save(update_fields=["status"])

        client = APIClient()
        client.force_authenticate(user=employee)
        res = client.post(f"/api/catalog/venues/{venue.id}/rate/", {"score": 6}, format="json")
        assert res.status_code == 400

    def test_list_venue_ratings(self, employee, venue, offer):
        """Ratings for a venue can be listed."""
        from rest_framework.test import APIClient
        booking = reserve_booking(employee, offer)
        booking.status = "checked_in"
        booking.save(update_fields=["status"])

        client = APIClient()
        client.force_authenticate(user=employee)
        client.post(f"/api/catalog/venues/{venue.id}/rate/", {"score": 4, "comment": "Nice"}, format="json")
        res = client.get(f"/api/catalog/venues/{venue.id}/ratings/")
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]["score"] == 4
