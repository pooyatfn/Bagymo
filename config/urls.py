"""URL root for bagym project."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/billing/", include("billing.urls")),
    path("api/budgets/", include("budgets.urls")),
]
