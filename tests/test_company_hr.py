"""
Tests for company HR dashboard API.
"""

import pytest
from rest_framework.test import APIClient

from accounts.models import User
from billing.services import reserve_booking


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def hr_client(api_client, company_admin):
    api_client.force_authenticate(user=company_admin)
    return api_client


class TestEmployeeList:
    def test_company_admin_sees_employees(self, hr_client, employee, company):
        resp = hr_client.get("/api/companies/employees/")
        assert resp.status_code == 200
        assert len(resp.data) >= 1
        assert resp.data[0]["phone_number"] == employee.phone_number

    def test_unauthenticated_denied(self, api_client):
        resp = api_client.get("/api/companies/employees/")
        assert resp.status_code in (401, 403)


class TestSetAnnualBudget:
    def test_set_annual(self, hr_client, employee):
        resp = hr_client.patch(
            f"/api/companies/employees/{employee.pk}/",
            {"annual_budget": 10_000_000}, format="json"
        )
        assert resp.status_code == 200
        emp = User.objects.get(pk=employee.pk)
        assert emp.annual_budget == 10_000_000
        assert emp.remaining_budget == 10_000_000  # reset to match


class TestAdjustBudget:
    def test_credit(self, hr_client, employee):
        resp = hr_client.post(
            f"/api/companies/employees/{employee.pk}/adjust/",
            {"amount": 500_000, "type": "credit", "description": "bonus"},
            format="json"
        )
        assert resp.status_code == 200
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == 8_000_000 + 500_000

    def test_debit(self, hr_client, employee):
        resp = hr_client.post(
            f"/api/companies/employees/{employee.pk}/adjust/",
            {"amount": 1_000_000, "type": "debit", "description": "penalty"},
            format="json"
        )
        assert resp.status_code == 200
        emp = User.objects.get(pk=employee.pk)
        assert emp.remaining_budget == 7_000_000

    def test_debit_exceeds_fails(self, hr_client, employee):
        resp = hr_client.post(
            f"/api/companies/employees/{employee.pk}/adjust/",
            {"amount": 9_000_000, "type": "debit"},
            format="json"
        )
        assert resp.status_code == 400


class TestDashboard:
    def test_dashboard(self, hr_client, employee, company):
        resp = hr_client.get("/api/companies/dashboard/")
        assert resp.status_code == 200
        assert resp.data["company_name"] == company.name
        assert resp.data["user_count"] >= 1


class TestLedger:
    def test_ledger(self, hr_client, employee, offer):
        reserve_booking(employee, offer)
        resp = hr_client.get(f"/api/companies/employees/{employee.pk}/ledger/")
        assert resp.status_code == 200
        assert len(resp.data) >= 1
        assert resp.data[0]["amount"] == -offer.price
