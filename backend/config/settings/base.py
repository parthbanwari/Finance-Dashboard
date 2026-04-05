"""Shared Django settings — loaded by environment-specific modules."""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "dev-only-change-me-in-production-not-secret",
)

DEBUG = False

ALLOWED_HOSTS: list[str] = []

INSTALLED_APPS = [
    "config.mongo_apps.MongoAdminConfig",
    "config.mongo_apps.MongoAuthConfig",
    "config.mongo_apps.MongoContentTypesConfig",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_mongodb_backend",
    "django_filters",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "corsheaders",
    "core",
    "users",
    "transactions",
    "analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
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
        "DIRS": [],
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

# MongoDB (django-mongodb-backend). Set MONGODB_URI to a full URI, e.g.:
#   mongodb://127.0.0.1:27017/finance_dashboard
#   mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/finance_dashboard?retryWrites=true&w=majority
# If NAME is empty, the database name is taken from the URI path.
_mongodb_uri = os.environ.get(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/finance_dashboard",
)
DATABASES = {
    "default": {
        "ENGINE": "django_mongodb_backend",
        "NAME": os.environ.get("MONGODB_NAME", ""),
        "HOST": _mongodb_uri,
        "OPTIONS": {},
    }
}

# Use cache-backed sessions so django.contrib.sessions does not require SQL/relational migrations.
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Set DJANGO_USE_DUMMY_DB=1 to run makemigrations without a live MongoDB (dummy engine skips DB history checks).
if os.environ.get("DJANGO_USE_DUMMY_DB", "").lower() in ("1", "true", "yes"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.dummy",
        }
    }

# Contrib apps ship SQL migrations; MongoDB uses replacement migration packages.
MIGRATION_MODULES = {
    "admin": "mongo_migrations.admin",
    "auth": "mongo_migrations.auth",
    "contenttypes": "mongo_migrations.contenttypes",
}

DATABASE_ROUTERS = ["django_mongodb_backend.routers.MongoRouter"]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django_mongodb_backend.fields.ObjectIdAutoField"

AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_RENDERER_CLASSES": ("core.renderers.EnvelopeJSONRenderer",),
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS", "7"))),
    # Enable with `rest_framework_simplejwt.token_blacklist` if you need rotation + revocation.
    "ROTATE_REFRESH_TOKENS": False,
}

# Cache (OTP codes, rate limits). Use Redis in production: set CACHES via env / prod settings.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "finance-dashboard-cache",
    }
}

# Email — console backend logs messages to stdout in dev; set SMTP in .env for production.
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() in ("1", "true", "yes")
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "Finance Dashboard <noreply@localhost>")

OTP_LOGIN_TTL_SECONDS = int(os.environ.get("OTP_LOGIN_TTL_SECONDS", "600"))
OTP_LOGIN_RATE_LIMIT_SECONDS = int(os.environ.get("OTP_LOGIN_RATE_LIMIT_SECONDS", "60"))


def _parse_origin_list(raw: str) -> list[str]:
    """Comma-separated origins: strip whitespace and trailing slashes (CORS requires scheme+host, no path)."""
    out: list[str] = []
    for part in raw.split(","):
        o = part.strip().rstrip("/")
        if o:
            out.append(o)
    return out


def _merge_unique(*groups: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for group in groups:
        for o in group:
            if o not in seen:
                seen.add(o)
                merged.append(o)
    return merged


# Local Vite dev (always allowed so .env can omit them).
_cors_local = _parse_origin_list("http://localhost:5173,http://127.0.0.1:5173")
# Deployed frontend(s); override with CORS_DEPLOYED_DEFAULT_ORIGINS if needed (empty = use built-in).
_deployed_raw = os.environ.get(
    "CORS_DEPLOYED_DEFAULT_ORIGINS",
    "https://finance-dashboard-frontend-fawn.vercel.app",
)
if not str(_deployed_raw).strip():
    _deployed_raw = "https://finance-dashboard-frontend-fawn.vercel.app"
_cors_deployed_defaults = _parse_origin_list(_deployed_raw)
_cors_from_env = _parse_origin_list(os.environ.get("CORS_ALLOWED_ORIGINS", ""))

CORS_ALLOWED_ORIGINS = _merge_unique(_cors_local, _cors_deployed_defaults, _cors_from_env)

# Match browser origins for CSRF on HTTPS (admin, session cookies, etc.).
CSRF_TRUSTED_ORIGINS = _merge_unique(_cors_local, _cors_deployed_defaults, _cors_from_env)

SPECTACULAR_SETTINGS = {
    "TITLE": "Finance Dashboard API",
    "DESCRIPTION": (
        "REST API for personal finance tracking: JWT authentication, transactions, "
        "categories, analytics summaries, and admin user management. "
        "All business routes are under `/api/v1/`."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
    "TAGS": [
        {"name": "Auth", "description": "Email OTP sign-in, JWT obtain/refresh, and token refresh."},
        {"name": "Users", "description": "Current user profile (`/me`) and admin-only user directory."},
        {"name": "Transactions", "description": "Transaction categories and ledger lines (scoped per user)."},
        {"name": "Analytics", "description": "Aggregated KPIs, trends, and recent activity."},
    ],
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "displayOperationId": False,
        "filter": True,
        "persistAuthorization": True,
    },
}
