"""Budgets API urls."""
from django.urls import path
from .views import budget_history

urlpatterns = [
    path("", budget_history, name="budget-history"),
]
