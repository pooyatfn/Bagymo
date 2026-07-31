"""
pytest fixtures for bagymo test suite.
"""
import pytest
from datetime import date
from accounts.models import User
from catalog.models import Category, Company, Venue, Offer, VenueCompanyAccess
from billing.services import commission_split, reserve_booking, InsufficientBudget


@pytest.fixture
def company(db):
    return Company.objects.create(
        name="TestCo", domain="test.co", default_annual_budget=8_000_000,
        fiscal_year_start=date.today(), is_active=True
    )


@pytest.fixture
def category(db):
    return Category.objects.create(slug="gym", name_en="Gym")


@pytest.fixture
def venue(db, category):
    return Venue.objects.create(
        name="TestGym", category=category, address="Tehran", lat=35.68, lng=51.38,
        status=Venue.Status.ACTIVE, is_verified=True
    )


@pytest.fixture
def offer(db, venue):
    price = 500_000
    return Offer.objects.create(
        venue=venue, name="1h gym", price=price,
        venue_payout=int(price * 0.94), duration_minutes=60, is_active=True
    )


@pytest.fixture
def employee(db, company):
    return User.objects.create_user(
        phone_number="0912111111", name="Emp1", role="employee",
        company=company, annual_budget=8_000_000, remaining_budget=8_000_000,
        fiscal_year_start=date.today(), is_verified=True
    )


@pytest.fixture
def company_admin(db, company):
    return User.objects.create_user(
        phone_number="0912222222", name="Admin1", role="company_admin",
        company=company, is_verified=True
    )
