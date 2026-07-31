from typing import Any

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        # register signal handlers here if needed later
        return None


# roles
class Role:
    EMPLOYEE = "employee"
    COMPANY_ADMIN = "company_admin"
    VENUE_STAFF = "venue_staff"
    ADMIN = "admin"
    choices = [
        (EMPLOYEE, "Employee"),
        (COMPANY_ADMIN, "Company Admin"),
        (VENUE_STAFF, "Venue Staff"),
        (ADMIN, "Platform Admin"),
    ]


__all__ = ["AccountsConfig", "Role"]
