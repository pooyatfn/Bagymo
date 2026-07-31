"""
Billing: employee budget ledger entries + settlement/invoice aggregates.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from catalog.models import Venue, Company  # noqa: E402 (avoids app-load cycle)


class BudgetLedger(models.Model):
    """
    Immutable audit trail of employee budget movements.
    - debit when they book (price), reset/yearly, adjust/refund
    """
    class Type:
        DEBIT = "debit"
        RESET = "reset"
        ADJUST = "adjust"
        REFUND = "refund"

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="budget_entries"
    )
    amount = models.IntegerField()  # + / - in Toman
    type = models.CharField(max_length=16, choices=[(Type.DEBIT, "Debit"), (Type.RESET, "Reset"),
                                                    (Type.ADJUST, "Adjust"), (Type.REFUND, "Refund")])
    reference = models.CharField(max_length=64, null=True, blank=True)  # e.g. "bookings:42"
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "billing_budgetledger"
        indexes = [models.Index(fields=["employee", "created_at"])]

    def __str__(self) -> str:
        return f"{self.employee} {self.get_type_display()} {self.amount:,}"


class SettlementBatch(models.Model):
    """
    Aggregated payouts to a venue for a period.
    Generated from checked-in bookings; paid via bank transfer.
    """
    class Status:
        PENDING = "pending"
        PROCESSING = "processing"
        PAID = "paid"
        FAILED = "failed"

    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name="settlements")
    period_start = models.DateField()
    period_end = models.DateField()
    total_net_payout = models.PositiveIntegerField()
    total_count = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=16, default=Status.PENDING,
                              choices=[(Status.PENDING, "Pending"), (Status.PROCESSING, "Processing"),
                                       (Status.PAID, "Paid"), (Status.FAILED, "Failed")])
    payment_ref = models.CharField(max_length=128, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "billing_settlementbatch"

    def __str__(self) -> str:
        return f"Settlement {self.venue} {self.get_status_display()} {self.total_net_payout:,}"


class Invoice(models.Model):
    """
    Monthly invoice to a company: sum of employee_commission on their bookings.
    """
    class Status:
        DRAFT = "draft"
        PENDING = "pending"
        PAID = "paid"
        FAILED = "failed"

    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="invoices")
    period_start = models.DateField()
    period_end = models.DateField()
    total_toman = models.PositiveIntegerField()
    commission_total_toman = models.PositiveIntegerField()  # platform emp commissions
    status = models.CharField(max_length=16, default=Status.DRAFT,
                              choices=[(Status.DRAFT, "Draft"), (Status.PENDING, "Pending"),
                                       (Status.PAID, "Paid"), (Status.FAILED, "Failed")])
    due_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_ref = models.CharField(max_length=128, null=True, blank=True)

    class Meta:
        db_table = "billing_invoice"
