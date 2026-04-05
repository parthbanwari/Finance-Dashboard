"""Production settings — set DJANGO_SETTINGS_MODULE=config.settings.prod."""

import os

from .base import *  # noqa: F403

DEBUG = False
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Serve admin / static assets when DEBUG is False (Render, etc.)
MIDDLEWARE = list(MIDDLEWARE)
if "whitenoise.middleware.WhiteNoiseMiddleware" not in MIDDLEWARE:
    _i = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1
    MIDDLEWARE.insert(_i, "whitenoise.middleware.WhiteNoiseMiddleware")

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
