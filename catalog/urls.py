"""Catalog API URLs."""
from django.urls import include, path
from rest_framework import routers

from .views import (
    CategoryViewSet,
    VenueViewSet,
    admin_companies,
    admin_venues,
    approve_company,
    approve_venue,
    company_info,
    create_venue_rating,
    offer_timeslots,
    pending_companies,
    pending_venues,
    register_venue,
    register_venue_public,
    reject_company,
    reject_venue,
    venue_offers,
    venue_profile,
    venue_profile_update,
    venue_ratings,
)

router = routers.DefaultRouter()
router.register(r"venues", VenueViewSet, basename="venue")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path("register-venue/", register_venue, name="register-venue"),
    path("register-venue-public/", register_venue_public, name="register-venue-public"),
    path("venue-offers/", venue_offers, name="venue-offers"),
    path("venue-offers/<int:offer_id>/", venue_offers, name="venue-offer-detail"),
    path("venue-profile/", venue_profile, name="venue-profile"),
    path("venue-profile/update/", venue_profile_update, name="venue-profile-update"),
    path("pending-venues/", pending_venues, name="pending-venues"),
    path("admin-venues/", admin_venues, name="admin-venues"),
    path("venues/<int:venue_id>/approve/", approve_venue, name="approve-venue"),
    path("venues/<int:venue_id>/reject/", reject_venue, name="reject-venue"),
    path("offer-timeslots/<int:offer_id>/", offer_timeslots, name="offer-timeslots"),
    path("venues/<int:venue_id>/ratings/", venue_ratings, name="venue-ratings"),
    path("venues/<int:venue_id>/rate/", create_venue_rating, name="create-venue-rating"),
    path("company-info/", company_info, name="company-info"),
    path("admin-companies/", admin_companies, name="admin-companies"),
    path("pending-companies/", pending_companies, name="pending-companies"),
    path("companies/<int:company_id>/approve/", approve_company, name="approve-company"),
    path("companies/<int:company_id>/reject/", reject_company, name="reject-company"),
]
