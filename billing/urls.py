"""Billing API urls."""
from django.urls import path
from .views import my_invoices, venue_settlements, company_bookings, company_analytics

urlpatterns = [
    path("invoices/", my_invoices, name="invoices-list"),
    path("venue/settlements/", venue_settlements, name="venue-settlements"),
    path("company-bookings/", company_bookings, name="company-bookings"),
    path("company-analytics/", company_analytics, name="company-analytics"),
]
