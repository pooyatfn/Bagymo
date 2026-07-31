"""Catalog API URLs."""
from rest_framework import routers
from django.urls import include, path
from .views import VenueViewSet, CategoryViewSet

router = routers.DefaultRouter()
router.register(r"venues", VenueViewSet, basename="venue")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
]
