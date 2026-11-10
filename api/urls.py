"""API urls."""
from django.urls import path

from core.views import ContactView

from .views import api_root

urlpatterns = [
    path("", api_root, name="api-root"),
    path("contact/", ContactView.as_view(), name="contact"),
]
