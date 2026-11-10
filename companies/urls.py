"""Company HR API URLs."""
from django.urls import include, path
from rest_framework import routers

from .views import EmployeeBudgetViewSet, company_dashboard, register_company

router = routers.DefaultRouter()
router.register(r"employees", EmployeeBudgetViewSet, basename="company-employee")

urlpatterns = [
    path("dashboard/", company_dashboard, name="company-dashboard"),
    path("register/", register_company, name="company-register"),
    path("", include(router.urls)),
]
