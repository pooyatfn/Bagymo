"""Bookings API URLs."""
from rest_framework import routers
from django.urls import include, path
from .views import BookingViewSet

router = routers.DefaultRouter()
router.register(r"", BookingViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
]
