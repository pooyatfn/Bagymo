"""Default AppConfig; budget reset task registered in billing/tasks.py."""
from django.apps import AppConfig


class BudgetsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "budgets"
