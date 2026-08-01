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
    district = models.CharField(max_length=80, null=True, blank=True)
    city = models.CharField(max_length=80, default="Tehran")
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
        return f"{self.name} ({self.category})"

    def gender_for_now(self):
        """Return the gender policy active at the current time, or the static default."""
        from django.utils import timezone
        now = timezone.now()
        day_map = {0: "sat", 1: "sun", 2: "mon", 3: "tue", 4: "wed", 5: "thu", 6: "fri"}
        today = day_map[now.weekday()]
        current_time = now.time()
        slots = self.gender_slots.filter(day_of_week=today, is_active=True)
        for slot in slots:
            if slot.start_time <= current_time < slot.end_time:
                return slot.gender
        return self.gender_policy


class VenueGenderSlot(models.Model):
    """Time-based gender policy for a venue.
    Example: male-only on sat/mon/wed 6:00-14:00, female-only 14:00-22:00."""
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="gender_slots")
    DAY_CHOICES = [
        ("sat", "Saturday"), ("sun", "Sunday"), ("mon", "Monday"),
        ("tue", "Tuesday"), ("wed", "Wednesday"), ("thu", "Thursday"), ("fri", "Friday"),
    ]
    day_of_week = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    gender = models.CharField(max_length=8, choices=Venue.GenderPolicy.CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_venuegenderslot"
        ordering = ["day_of_week", "start_time"]
        indexes = [models.Index(fields=["venue", "day_of_week"])]

    def __str__(self):
        return f"{self.venue.name} {self.get_day_of_week_display()} {self.start_time}-{self.end_time} → {self.gender}"


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


class TimeSlot(models.Model):
    """A bookable time slot for an offer on a specific date.
    Tracks capacity to prevent overbooking."""
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name="time_slots")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveSmallIntegerField(default=0)  # 0 = unlimited
    booked_count = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "catalog_timeslot"
        unique_together = ("offer", "date", "start_time")
        indexes = [models.Index(fields=["offer", "date", "start_time"])]

    def __str__(self):
        return f"{self.offer} {self.date} {self.start_time}-{self.end_time}"

    @property
    def is_available(self) -> bool:
        if not self.is_active:
            return False
        if self.capacity == 0:
            return True
        return self.booked_count < self.capacity

    @property
    def remaining_capacity(self) -> int:
        if self.capacity == 0:
            return 999
        return max(0, self.capacity - self.booked_count)


class VenueRating(models.Model):
    """Employee rating + comment for a venue. One rating per user per venue (editable)."""
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="venue_ratings")
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1-5 stars",
    )
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_venuerating"
        unique_together = ("venue", "user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} → {self.venue}: {self.score}★"
