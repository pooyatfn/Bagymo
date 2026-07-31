"""Expose celery app on package import for `celery -A config` discovery."""
from .celery import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
