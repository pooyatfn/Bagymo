"""
Catalog: categories, companies, venues, offers.
"""
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    """Wellness category: gym, pool, cinema, ... DB-driven so adding new is trivial."""
    slug = models.SlugField(unique=True, max_length=40)  # 'gym', 'pool'
    name_en = models.CharField(max_length=60)
    name_fa = models.CharField(max_length=60, null=True, blank=True)
    icon_class = models.CharField(max_length=40, default="gym")
    is_active = models.BooleanField(default=True)
    # category-level rules, e.g. {"gender_policy":"required","capacity_key":"hourly"}
    rules_json = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "catalog_category"
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name_en


class Company(models.Model):
    """B2B customer: buys employee wellness budgets."""
    name = models.CharField(max_length=120)
    domain = models.CharField(max_length=80, null=True, blank=True)  # for matching emails
    # default annual budget per employee (Toman)
    default_annual_budget = models.PositiveIntegerField(default=0)
    fiscal_year_start = models.DateField(null=True, blank=True)  # null => use today
    payment_terms_days = models.PositiveSmallIntegerField(default=30)
    credit_limit = models.PositiveIntegerField(default=0)  # Toman
    billing_email = models.EmailField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    # commission override (3% default lives in settings)
    commission_pct_emp_override = models.FloatField(
        default=settings.DEFAULT_COMMISSION_PCT_EMP,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_company"

    def __str__(self) -> str:
        return self.name


class Venue(models.Model):
    """A gym/pool/cinema that has a contract with the platform.

    Note: a venue is *eligible* here. Whether a given company's employees can
    access it is enforced by VenueCompanyAccess, so one venue can serve many
    companies with per-company pricing.
    """
    class Status:
        PENDING = "pending"
        ACTIVE = "active"
        SUSPENDED = "suspended"
        CHOICES = [
            (PENDING, "Pending"),
            (ACTIVE, "Active"),
            (SUSPENDED, "Suspended"),
        ]

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="venues")
    name = models.CharField(max_length=120)
    owner_name = models.CharField(max_length=80, null=True, blank=True)
    phone = models.CharField(max_length=32, null=True, blank=True)
    address = models.CharField(max_length=300, null=True, blank=True)
    # location stored as lat/lng so the project runs on plain Postgres/sqlite;
    # swap to a PostGIS PointField for production geo queries.
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class GenderPolicy:
        MIXED = "mixed"
        MALE_ONLY = "male"
        FEMALE_ONLY = "female"
        CHOICES = [
            (MIXED, "Mixed"),
            (MALE_ONLY, "Male only"),
            (FEMALE_ONLY, "Female only"),
        ]
    gender_policy = models.CharField(max_length=8, choices=GenderPolicy.CHOICES, default=GenderPolicy.MIXED)

    hours_json = models.JSONField(default=dict, blank=True)  # {"mon":[9,22], ...}
    capacity = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=16, choices=Status.CHOICES, default=Status.PENDING)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_venue"

    def __str__(self) -> str:
        return f"{self.name} ({self.get_category_display()})"


class VenueCompanyAccess(models.Model):
    """Join: which companies can use a venue + optional override payout rate.

    Default venue payout = Offer.venue_payout. This lets a company negotiate a
    different payout for the same offer (rare in v1, kept for flexibility).
    """
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="company_access")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="venue_access")
    # override per-company payout; null => use Offer.venue_payout
    payout_override_toman = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    agreed_at = models.DateTimeField(auto_now_add=True)
    terms_text = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "catalog_venuecompanyaccess"
        unique_together = ("venue", "company")

    def __str__(self) -> str:
        return f"{self.venue} x {self.company}"


class Offer(models.Model):
    """
    A concrete bookable product at a venue:
    - price        : employee pays / budget debited (Toman)
    - venue_payout : what the venue is guaranteed to receive net per visit (Toman)
    The platform margin = price − venue_payout, split into:
        emp_commission   = price × commission_pct_emp
        venue_commission = venue_payout × commission_pct_venue  (reserved from venue gross)
        venue_net        = venue_payout − venue_commission
    (See billing/services.py reserve_booking() for the canonical formula.)
    """
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="offers")
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    price = models.PositiveIntegerField()  # employee budget cost (Toman)
    venue_payout = models.PositiveIntegerField()  # guaranteed net to venue (Toman)
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    capacity_per_slot = models.PositiveSmallIntegerField(default=0)  # 0 => unlimited
    operating_days_json = models.JSONField(default=dict, blank=True)  # {"mon":[9,22],...}
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    gender_restriction = models.CharField(
        max_length=8,
        choices=Venue.GenderPolicy.CHOICES,
        default=Venue.GenderPolicy.MIXED,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_offer"
        unique_together = ("venue", "name")

    def __str__(self) -> str:
        return f"{self.venue}: {self.name} ({self.price:,} ﷼)"
