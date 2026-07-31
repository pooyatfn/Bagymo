"""Catalog API URLs."""
from rest_framework import routers
from django.urls import include, path
from .views import (
    VenueViewSet, CategoryViewSet, register_venue, venue_offers,
    venue_profile, venue_profile_update, approve_venue, reject_venue,
    pending_venues, offer_timeslots,
)

router = routers.DefaultRouter()
router.register(r"venues", VenueViewSet, basename="venue")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path("register-venue/", register_venue, name="register-venue"),
    path("venue-offers/", venue_offers, name="venue-offers"),
    path("venue-profile/", venue_profile, name="venue-profile"),
    path("venue-profile/update/", venue_profile_update, name="venue-profile-update"),
    path("pending-venues/", pending_venues, name="pending-venues"),
    path("venues/<int:venue_id>/approve/", approve_venue, name="approve-venue"),
    path("venues/<int:venue_id>/reject/", reject_venue, name="reject-venue"),
    path("offer-timeslots/<int:offer_id>/", offer_timeslots, name="offer-timeslots"),
]
