"""Catalog API URLs."""
from rest_framework import routers
from django.urls import include, path
from .views import VenueViewSet, CategoryViewSet, register_venue, venue_offers, venue_profile, venue_profile_update

router = routers.DefaultRouter()
router.register(r"venues", VenueViewSet, basename="venue")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path("register-venue/", register_venue, name="register-venue"),
    path("venue-offers/", venue_offers, name="venue-offers"),
    path("venue-profile/", venue_profile, name="venue-profile"),
    path("venue-profile/update/", venue_profile_update, name="venue-profile-update"),
]
