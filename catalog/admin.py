from django.contrib import admin
from .models import Category, Company, Venue, VenueCompanyAccess
from bookings.models import Booking
from billing.models import BudgetLedger, SettlementBatch, Invoice


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "name_en", "name_fa", "is_active")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "domain", "default_annual_budget", "is_active")
    search_fields = ("name", "domain")


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "status", "gender_policy", "is_verified")
    list_filter = ("category", "status", "gender_policy")
    search_fields = ("name", "address")


@admin.register(VenueCompanyAccess)
class VenueCompanyAccessAdmin(admin.ModelAdmin):
    list_display = ("venue", "company", "payout_override_toman", "is_active")
    autocomplete_fields = ("venue", "company")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "check_in_code", "employee", "venue", "offer", "price", "status", "reserved_at")
    list_filter = ("status", "venue__category", "reserved_at")
    readonly_fields = ("price", "employee_commission", "venue_gross_payout",
                       "venue_commission", "venue_net_payout", "check_in_code")


@admin.register(BudgetLedger)
class BudgetLedgerAdmin(admin.ModelAdmin):
    list_display = ("employee", "type", "amount", "reference", "created_at")
    readonly_fields = ("employee", "type", "amount", "reference", "created_at")


@admin.register(SettlementBatch)
class SettlementBatchAdmin(admin.ModelAdmin):
    list_display = ("venue", "period_start", "period_end", "total_net_payout", "status")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("company", "period_start", "period_end", "total_toman", "status")
