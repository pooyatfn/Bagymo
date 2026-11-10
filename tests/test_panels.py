"""
Tests for panel flows added/fixed during the cleanup:
- HR can add / remove employees and HR (company_hr) shares the company panel
- check-in is scoped to the staff member's own venue and reports failures
- public venue sign-up validates before creating anything
"""
import pytest
from rest_framework.test import APIClient

from accounts.models import User
from billing.services import reserve_booking
from bookings.models import Booking
from catalog.models import Venue, VenueCompanyAccess


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def hr_user(db, company):
    return User.objects.create_user(phone_number="09120000099", role="company_hr", company=company, is_verified=True)


class TestAddEmployee:
    def test_add_new_employee_gets_default_budget(self, client, company_admin, company):
        client.force_authenticate(company_admin)
        resp = client.post("/api/companies/employees/", {"phone_number": "۰۹۱۲۵۵۵۵۵۵۵", "name": "Neda"}, format="json")
        assert resp.status_code == 201, resp.data
        emp = User.objects.get(phone_number="09125555555")
        assert emp.company_id == company.id
        assert emp.role == "user"
        assert emp.annual_budget == company.default_annual_budget == emp.remaining_budget

    def test_add_existing_free_user_attaches_to_company(self, client, company_admin, company):
        free = User.objects.create_user(phone_number="09126666666", role="user")
        client.force_authenticate(company_admin)
        resp = client.post("/api/companies/employees/", {"phone_number": free.phone_number, "annual_budget": 1000}, format="json")
        assert resp.status_code == 201
        free.refresh_from_db()
        assert free.company_id == company.id and free.remaining_budget == 1000

    def test_cannot_steal_employee_of_another_company(self, client, company_admin, db):
        from catalog.models import Company

        other = Company.objects.create(name="Other", status="active")
        User.objects.create_user(phone_number="09127777777", role="user", company=other)
        client.force_authenticate(company_admin)
        resp = client.post("/api/companies/employees/", {"phone_number": "09127777777"}, format="json")
        assert resp.status_code == 400

    def test_invalid_phone_rejected(self, client, company_admin):
        client.force_authenticate(company_admin)
        assert client.post("/api/companies/employees/", {"phone_number": "123"}, format="json").status_code == 400

    def test_remove_employee_detaches_and_zeroes_budget(self, client, company_admin, employee):
        client.force_authenticate(company_admin)
        resp = client.delete(f"/api/companies/employees/{employee.pk}/")
        assert resp.status_code == 204
        employee.refresh_from_db()
        assert employee.company_id is None and employee.remaining_budget == 0
        assert User.objects.filter(pk=employee.pk).exists()  # account is kept


class TestCompanyHrRole:
    def test_hr_can_use_company_panel(self, client, hr_user, employee):
        client.force_authenticate(hr_user)
        assert client.get("/api/companies/dashboard/").status_code == 200
        assert client.get("/api/companies/employees/").status_code == 200
        assert client.get("/api/billing/company-analytics/").status_code == 200
        assert client.get("/api/billing/company-bookings/").status_code == 200

    def test_employee_cannot_use_company_panel(self, client, employee):
        client.force_authenticate(employee)
        assert client.get("/api/companies/dashboard/").status_code == 403


class TestCheckIn:
    @pytest.fixture
    def booking(self, employee, offer, company):
        VenueCompanyAccess.objects.create(venue=offer.venue, company=company)
        return reserve_booking(employee, offer)

    def _staff(self, venue, phone):
        return User.objects.create_user(phone_number=phone, role="venue_staff", venue=venue)

    def test_staff_checks_in_own_venue(self, client, booking):
        client.force_authenticate(self._staff(booking.venue, "09121231231"))
        resp = client.post("/api/bookings/verify-checkin/", {"check_in_code": booking.check_in_code.lower()}, format="json")
        assert resp.status_code == 200 and resp.data["ok"] is True
        booking.refresh_from_db()
        assert booking.status == Booking.Status.CHECKED_IN

    def test_staff_of_other_venue_cannot_check_in(self, client, booking, category):
        other = Venue.objects.create(name="Other", category=category, status="active")
        client.force_authenticate(self._staff(other, "09121231232"))
        resp = client.post("/api/bookings/verify-checkin/", {"check_in_code": booking.check_in_code}, format="json")
        assert resp.data["ok"] is False
        booking.refresh_from_db()
        assert booking.status == Booking.Status.PAID

    def test_employee_cannot_check_themselves_in(self, client, booking, employee):
        client.force_authenticate(employee)
        resp = client.post("/api/bookings/verify-checkin/", {"check_in_code": booking.check_in_code}, format="json")
        assert resp.status_code == 403

    def test_double_check_in_is_reported(self, client, booking):
        client.force_authenticate(self._staff(booking.venue, "09121231233"))
        client.post("/api/bookings/verify-checkin/", {"check_in_code": booking.check_in_code}, format="json")
        resp = client.post("/api/bookings/verify-checkin/", {"check_in_code": booking.check_in_code}, format="json")
        assert resp.data["ok"] is False


class TestBookingErrors:
    def test_insufficient_budget_is_a_400_not_a_500(self, client, employee, offer, company):
        VenueCompanyAccess.objects.create(venue=offer.venue, company=company)
        employee.remaining_budget = 10
        employee.save(update_fields=["remaining_budget"])
        client.force_authenticate(employee)
        resp = client.post("/api/bookings/", {"offer_id": offer.id}, format="json")
        assert resp.status_code == 400

    def test_unknown_offer_is_a_400(self, client, employee):
        client.force_authenticate(employee)
        assert client.post("/api/bookings/", {"offer_id": 999999}, format="json").status_code == 400


class TestPublicVenueSignup:
    def test_signup_creates_pending_venue_and_manager(self, client, category):
        resp = client.post(
            "/api/catalog/register-venue-public/",
            {"name": "Gym X", "category_slug": "gym", "owner_name": "Ali", "manager_phone": "09128888888"},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        manager = User.objects.get(phone_number="09128888888")
        assert manager.role == "venue_staff" and manager.venue.status == "pending"
        assert manager.name == "Ali"

    def test_duplicate_phone_creates_no_orphan_venue(self, client, category, employee):
        before = Venue.objects.count()
        resp = client.post(
            "/api/catalog/register-venue-public/",
            {"name": "Gym Y", "category_slug": "gym", "manager_phone": employee.phone_number},
            format="json",
        )
        assert resp.status_code == 400
        assert Venue.objects.count() == before

    def test_categories_are_public(self, client, category):
        assert client.get("/api/catalog/categories/").status_code == 200
