"""Company HR API URLs."""
from django.urls import path, include
from rest_framework import routers
from .views import EmployeeBudgetViewSet, company_dashboard

router = routers.DefaultRouter()
router.register(r"employees", EmployeeBudgetViewSet, basename="company-employee")

urlpatterns = [
    path("dashboard/", company_dashboard, name="company-dashboard"),
    path("", include(router.urls)),
]
