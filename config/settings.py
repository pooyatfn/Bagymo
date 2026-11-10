"""
Django settings for bagymo (bagymo.ir) project.
Corporate wellness marketplace - Iran web-only.
"""
from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def env_list(name: str, default: str) -> list[str]:
    return [v.strip() for v in os.getenv(name, default).split(",") if v.strip()]


ENV = os.getenv("ENV", "dev")
DEBUG = env_bool("DEBUG", True)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
if not DEBUG and SECRET_KEY.startswith("dev-"):
    raise ImproperlyConfigured("Set a real SECRET_KEY when DEBUG is off.")
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "*" if DEBUG else "localhost")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "corsheaders",
    "django_celery_beat",
    "django_redis",
    # local
    "core",
    "accounts",
    "budgets",
    "catalog",
    "bookings",
    "billing",
    "api",
    "companies",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "config" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database -------------------------------------------------------------
# PostGIS is a future enhancement for production geo queries.
# For now the model stores lat/lng in FloatFields so plain Postgres works.
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "bagymo")
POSTGRES_USER = os.getenv("POSTGRES_USER", "bagymo")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "bagymo123")

if os.getenv("DB_ENGINE", "postgres").lower() == "sqlite":
    # quick local runs without Postgres: DB_ENGINE=sqlite
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": POSTGRES_HOST,
            "PORT": POSTGRES_PORT,
            "NAME": POSTGRES_DB,
            "USER": POSTGRES_USER,
            "PASSWORD": POSTGRES_PASSWORD,
            "CONN_MAX_AGE": 60,
        }
    }

# Cache + Celery -------------------------------------------------------
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }
else:
    # REDIS_URL= (empty) → in-process cache, fine for a single dev server
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
# Run tasks inline unless a worker is configured (CELERY_EAGER=false in production).
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_EAGER", True)
CELERY_TIMEZONE = "Asia/Tehran"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

# DRF + auth -----------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_LIFETIME_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", "7"))),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
AUTH_USER_MODEL = "accounts.User"
LOGIN_REDIRECT_URL = "/"

# Password validation -------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]

# Internationalisation ------------------------------------------------
LANGUAGE_CODE = "fa-ir"  # Persian validation messages from Django/DRF
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

# Static + media ------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [p for p in [BASE_DIR / "config" / "static"] if p.exists()]
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Third-party service keys -------------------------------------------
KAVENEGAR_API_KEY = os.getenv("KAVENEGAR_API_KEY", "")
KAVENEGAR_SENDER = os.getenv("KAVENEGAR_SENDER", "")
ZARINPAL_MERCHANT_ID = os.getenv("ZARINPAL_MERCHANT_ID", "")
IDPAY_PIN = os.getenv("IDPAY_PIN", "")
IDPAY_USEDOMAIN = os.getenv("IDPAY_USEDOMAIN", "false").lower() == "true"
NESHAN_API_KEY = os.getenv("NESHAN_API_KEY", "")
NESHAN_SEARCH_BASE_URL = os.getenv("NESHAN_SEARCH_BASE_URL", "https://api.neshan.org/")

# Nightly venue import from Neshan (celery beat → catalog.sync_venues)
VENUE_SYNC_ENABLED = env_bool("VENUE_SYNC_ENABLED", True)
VENUE_SYNC_CITIES = env_list("VENUE_SYNC_CITIES", "tehran")
VENUE_SYNC_GRID = int(os.getenv("VENUE_SYNC_GRID", "3"))
VENUE_SYNC_SPACING_KM = float(os.getenv("VENUE_SYNC_SPACING_KM", "8"))
VENUE_SYNC_HOUR = int(os.getenv("VENUE_SYNC_HOUR", "3"))  # Tehran time

CELERY_BEAT_SCHEDULE = {}
if VENUE_SYNC_ENABLED:
    from celery.schedules import crontab

    CELERY_BEAT_SCHEDULE["sync-venues-nightly"] = {
        "task": "catalog.sync_venues",
        "schedule": crontab(hour=VENUE_SYNC_HOUR, minute=17),
    }

# Business defaults (commission + budget) -----------------------------
DEFAULT_COMMISSION_PCT_EMP = 0.03
DEFAULT_COMMISSION_PCT_VENUE = 0.03
RESERVATION_TTL_MINUTES = 15
MIN_PAYOUT_TOMAN = 100_000

# CORS (dev: allow localhost) -------------------------------------------
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:3000")

# Production hardening --------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")
