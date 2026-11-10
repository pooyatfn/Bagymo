"""Billing API urls."""
from django.urls import path

from .views import company_analytics, company_bookings, my_invoices, venue_settlements

urlpatterns = [
    path("invoices/", my_invoices, name="invoices-list"),
    path("venue/settlements/", venue_settlements, name="venue-settlements"),
    path("company-bookings/", company_bookings, name="company-bookings"),
    path("company-analytics/", company_analytics, name="company-analytics"),
]
