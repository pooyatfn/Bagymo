"""
Tests for the commission split and booking reservation flow.
"""
import pytest

from accounts.models import User
from billing.models import BudgetLedger
from billing.services import InsufficientBudget, commission_split, reserve_booking


class TestCommissionSplit:
    def test_3percent_split(self):
        """price=500000, c_emp=0.03, c_venue=0.03 -> emp=15k, venue_net=470k"""
        result = commission_split(500_000, 0.03, 0.03)
        assert result["employee_commission"] == 15_000
        assert result["venue_commission"] == 15_000
        assert result["venue_net_payout"] == 470_000
        assert result["employee_commission"] + result["venue_commission"] + result["venue_net_payout"] == 500_000

    def test_margins_sum_to_price_minus_venue_net(self):
        for price in [100_000, 300_000, 500_000, 1_200_000]:
            r = commission_split(price, 0.03, 0.03)
            margin = r["employee_commission"] + r["venue_commission"]
            assert price - r["venue_net_payout"] == margin, f"price={price}"


class TestReserveBooking:
    def test_success(self, employee, offer):
        bal_before = employee.remaining_budget
        booking = reserve_booking(employee, offer)
        assert booking.price == offer.price
        assert booking.status == "paid"
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == bal_before - offer.price

    def test_ledger_entry_created(self, employee, offer):
        reserve_booking(employee, offer)
        entries = BudgetLedger.objects.filter(employee=employee, type="debit")
        assert entries.count() == 1
        assert entries.first().amount == -offer.price

    def test_insufficient_budget(self, employee, offer):
        employee.remaining_budget = offer.price - 1
        employee.save()
        with pytest.raises(InsufficientBudget):
            reserve_booking(employee, offer)

    def test_budget_locking(self, employee, offer):
        """Second booking should fail when budget exactly equals one offer."""
        employee.remaining_budget = offer.price
        employee.save()
        reserve_booking(employee, offer)
        with pytest.raises(InsufficientBudget):
            reserve_booking(employee, offer)
