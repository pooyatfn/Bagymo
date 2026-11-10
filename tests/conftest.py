"""
pytest fixtures for bagymo test suite.
"""
from datetime import date, time

import pytest

from accounts.models import User
from catalog.models import Category, Company, Offer, TimeSlot, Venue


@pytest.fixture
def company(db):
    return Company.objects.create(
        name="TestCo", domain="test.co", default_annual_budget=8_000_000,
        fiscal_year_start=date.today(), is_active=True,
        status=Company.Status.ACTIVE,
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
        phone_number="0912111111", name="Emp1", role="user",
        company=company, annual_budget=8_000_000, remaining_budget=8_000_000,
        fiscal_year_start=date.today(), is_verified=True
    )


@pytest.fixture
def company_admin(db, company):
    return User.objects.create_user(
        phone_number="0912222222", name="Admin1", role="company_admin",
        company=company, is_verified=True
    )


@pytest.fixture
def male_employee(db, company):
    return User.objects.create_user(
        phone_number="0912333333", name="MaleEmp", role="user",
        company=company, annual_budget=8_000_000, remaining_budget=8_000_000,
        fiscal_year_start=date.today(), is_verified=True, gender="male"
    )


@pytest.fixture
def female_employee(db, company):
    return User.objects.create_user(
        phone_number="0912444444", name="FemaleEmp", role="user",
        company=company, annual_budget=8_000_000, remaining_budget=8_000_000,
        fiscal_year_start=date.today(), is_verified=True, gender="female"
    )


@pytest.fixture
def male_only_venue(db, category):
    return Venue.objects.create(
        name="MaleGym", category=category, address="Tehran", lat=35.69, lng=51.39,
        status=Venue.Status.ACTIVE, is_verified=True, gender_policy="male"
    )


@pytest.fixture
def female_only_venue(db, category):
    return Venue.objects.create(
        name="FemaleGym", category=category, address="Tehran", lat=35.70, lng=51.40,
        status=Venue.Status.ACTIVE, is_verified=True, gender_policy="female"
    )


@pytest.fixture
def mixed_venue(db, category):
    return Venue.objects.create(
        name="MixedGym", category=category, address="Tehran", lat=35.71, lng=51.41,
        status=Venue.Status.ACTIVE, is_verified=True, gender_policy="mixed"
    )


@pytest.fixture
def timeslot(db, offer):
    return TimeSlot.objects.create(
        offer=offer, date=date.today(), start_time=time(10, 0), end_time=time(12, 0),
        capacity=3, booked_count=0, is_active=True
    )
