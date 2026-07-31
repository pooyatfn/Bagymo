"""Billing API urls."""
from django.urls import path
from .views import my_invoices, venue_settlements

urlpatterns = [
    path("invoices/", my_invoices, name="invoices-list"),
    path("venue/settlements/", venue_settlements, name="venue-settlements"),
]
