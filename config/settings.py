"""
Django settings for bagymo (bagymo.ir) project.
Corporate wellness marketplace - Iran web-only.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv  # noqa: E402

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

ENV = os.getenv("ENV", "dev")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

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
    "maps",
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
    "core.middleware.RoleMiddleware",
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
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
# In dev (no Redis running) execute celery tasks synchronously when .delay() is called.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

# DRF + auth -----------------------------------------------------------
from datetime import timedelta  # noqa: E402

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
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

# Static + media ------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "config" / "static"]
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
NESHAN_SEARCH_BASE_URL = os.getenv("NESHAN_SEARCH_BASE_URL", "https://api.neshan.net/")

# Business defaults (commission + budget) -----------------------------
DEFAULT_COMMISSION_PCT_EMP = 0.03
DEFAULT_COMMISSION_PCT_VENUE = 0.03
RESERVATION_TTL_MINUTES = 15
MIN_PAYOUT_TOMAN = 100_000

# CORS (dev: allow localhost) -------------------------------------------
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
