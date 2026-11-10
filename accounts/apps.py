
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        # register signal handlers here if needed later
        return None


# roles
class Role:
    USER = "user"
    COMPANY_ADMIN = "company_admin"
    COMPANY_HR = "company_hr"
    VENUE_STAFF = "venue_staff"
    ADMIN = "admin"
    choices = [
        (USER, "User"),
        (COMPANY_ADMIN, "Company Admin"),
        (COMPANY_HR, "Company HR"),
        (VENUE_STAFF, "Venue Staff"),
        (ADMIN, "Platform Admin"),
    ]


__all__ = ["AccountsConfig", "Role"]
