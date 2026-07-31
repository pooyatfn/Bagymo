"""
User model + budget fields (employee simplification).
- phone_number is the unique login.
- role drives permissions/dashboard.
- annual_budget / remaining_budget / fiscal_year_start are kept on User
  for the employee role (a per-company contract can override later).
"""
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager, PermissionsMixin
from django.conf import settings
from django.utils import timezone


def _now():
    return timezone.now()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, phone_number, password, **extra):
        if not phone_number:
            raise ValueError("Users must have a phone number")
        phone_number = self.normalize_email(phone_number)
        user = self.model(phone_number=phone_number, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone_number, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        if extra.pop("create_tokens", None) is not None:
            ...  # no-op safety
        return self._create_user(phone_number, password, **extra)

    def create_superuser(self, phone_number, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_active", True)
        return self._create_user(phone_number, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=80, null=True, blank=True)

    # role
    class Role:
        EMPLOYEE = "employee"
        COMPANY_ADMIN = "company_admin"
        VENUE_STAFF = "venue_staff"
        ADMIN = "admin"
        CHOICES = [
            (EMPLOYEE, "Employee"),
            (COMPANY_ADMIN, "Company Admin"),
            (VENUE_STAFF, "Venue Staff"),
            (ADMIN, "Platform Admin"),
        ]

    role = models.CharField(max_length=24, choices=Role.CHOICES, default=Role.EMPLOYEE)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Company affiliation (used by employee + company_admin)
    company = models.ForeignKey(
        "catalog.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    # Venue staff member is employed by a venue
    venue = models.ForeignKey(
        "catalog.Venue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff",
    )

    # Employee wellness budget (annual, resets yearly) - simplified on User
    annual_budget = models.PositiveIntegerField(default=0)  # Toman
    remaining_budget = models.PositiveIntegerField(default=0)  # Toman
    fiscal_year_start = models.DateField(default=timezone.now)

    # Wallet (recharged via gateway in Step 6) - kept for completeness
    wallet_balance = models.PositiveIntegerField(default=0)  # Toman, unused in v1

    # Venue / payout info
    sheba = models.CharField(max_length=26, null=True, blank=True)

    # Employee gender (for venue gender-policy filtering)
    class Gender:
        MALE = "male"
        FEMALE = "female"
        CHOICES = [
            (MALE, "Male"),
            (FEMALE, "Female"),
        ]

    gender = models.CharField(max_length=8, choices=Gender.CHOICES, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "accounts_user"

    def __str__(self) -> str:
        return f"{self.phone_number} ({self.role})"

    @property
    def is_budget_exhausted(self) -> bool:
        return self.remaining_budget <= 0

    def effective_commission_pct_emp(self) -> float:
        from django.conf import settings as _s
        return getattr(self.company, "commission_pct_emp_override", None) or _s.DEFAULT_COMMISSION_PCT_EMP

    def effective_commission_pct_venue(self) -> float:
        from django.conf import settings as _s
        return _s.DEFAULT_COMMISSION_PCT_VENUE
