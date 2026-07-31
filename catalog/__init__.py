"""Placeholder for future map/geosearch tasks (Neshan)."""
from django.apps import AppConfig


class CatalogGeoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "catalog.geo" if False else "catalog"
