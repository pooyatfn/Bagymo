"""Catalog API URLs."""
from rest_framework import routers
from django.urls import include, path
from .views import (
    VenueViewSet, CategoryViewSet, register_venue, venue_offers,
    venue_profile, venue_profile_update, approve_venue, reject_venue,
    pending_venues, offer_timeslots, venue_ratings, create_venue_rating,
    company_info, admin_companies, pending_companies, approve_company,
    reject_company,
)

router = routers.DefaultRouter()
router.register(r"venues", VenueViewSet, basename="venue")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path("register-venue/", register_venue, name="register-venue"),
    path("venue-offers/", venue_offers, name="venue-offers"),
    path("venue-offers/<int:offer_id>/", venue_offers, name="venue-offer-detail"),
    path("venue-profile/", venue_profile, name="venue-profile"),
    path("venue-profile/update/", venue_profile_update, name="venue-profile-update"),
    path("pending-venues/", pending_venues, name="pending-venues"),
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
