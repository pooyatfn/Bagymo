"""
Tests for the budget reset command.
"""
import pytest
from datetime import date, timedelta
from accounts.models import User
from billing.models import BudgetLedger
from django.core.management import call_command


@pytest.mark.django_db
class TestResetBudgets:
    def test_reset_due(self):
        """Employee whose fiscal year started 13 months ago gets reset."""
        u = User.objects.create_user(
            phone_number="0912333333", name="OldEmp", role="employee",
            annual_budget=8_000_000, remaining_budget=2_000_000,
            fiscal_year_start=date.today() - timedelta(days=400),
            is_verified=True, is_active=True
        )
        call_command("reset_budgets")
        u.refresh_from_db()
        assert u.remaining_budget == 8_000_000
        assert BudgetLedger.objects.filter(employee=u, type="reset").count() == 1

    def test_no_reset_when_not_due(self):
        """Employee whose fiscal year started today does NOT get reset."""
        u = User.objects.create_user(
            phone_number="0912444444", name="NewEmp", role="employee",
            annual_budget=8_000_000, remaining_budget=3_000_000,
            fiscal_year_start=date.today(),
            is_verified=True, is_active=True
        )
        call_command("reset_budgets")
        u.refresh_from_db()
        assert u.remaining_budget == 3_000_000
        assert BudgetLedger.objects.filter(employee=u, type="reset").count() == 0
