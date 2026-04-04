"""Email OTP for passwordless sign-in. Codes stored in Django cache (short TTL)."""

from __future__ import annotations

import logging
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

OTP_TTL = getattr(settings, "OTP_LOGIN_TTL_SECONDS", 600)
RATE_LIMIT_TTL = getattr(settings, "OTP_LOGIN_RATE_LIMIT_SECONDS", 60)


def _norm_email(email: str) -> str:
    return email.strip().lower()


def _otp_key(email: str) -> str:
    return f"otp:login:{_norm_email(email)}"


def _rate_key(email: str) -> str:
    return f"otp:ratelimit:{_norm_email(email)}"


def issue_tokens_for_user(user) -> dict[str, str]:
    """Same shape as SimpleJWT token endpoint; access payload includes `role`."""
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    access["role"] = user.role
    return {
        "refresh": str(refresh),
        "access": str(access),
    }


def send_login_otp(email: str) -> tuple[bool, str | None]:
    """
    Send a 6-digit OTP to the user's email if an active account exists.
    Returns (ok, error_message). On missing user, ok is True (generic response; no enumeration).
    """
    normalized = _norm_email(email)
    if not normalized:
        return False, "Email is required."

    if cache.get(_rate_key(normalized)):
        return False, "Please wait a minute before requesting another code."

    User = get_user_model()
    user = User.objects.filter(email__iexact=normalized).first()
    if not user or not user.is_active:
        cache.set(_rate_key(normalized), True, RATE_LIMIT_TTL)
        return True, None

    otp = f"{secrets.randbelow(1000000):06d}"
    cache.set(_otp_key(normalized), otp, OTP_TTL)
    cache.set(_rate_key(normalized), True, RATE_LIMIT_TTL)

    subject = "Your sign-in code"
    body = (
        f"Your one-time code is: {otp}\n\n"
        f"It expires in {OTP_TTL // 60} minutes.\n\n"
        "If you did not request this, you can ignore this email."
    )
    recipient = user.email.strip() if user.email else normalized
    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("OTP email send failed: %s", exc)
        cache.delete(_otp_key(normalized))
        return False, "Could not send email. Check server mail settings and try again."

    return True, None


def verify_login_otp(email: str, otp: str):
    """Return User if OTP is valid; otherwise None."""
    normalized = _norm_email(email)
    code = "".join(otp.split()) if otp else ""
    if not normalized or len(code) != 6 or not code.isdigit():
        return None

    stored = cache.get(_otp_key(normalized))
    if not stored or stored != code:
        return None

    User = get_user_model()
    user = User.objects.filter(email__iexact=normalized).first()
    if not user or not user.is_active:
        return None

    cache.delete(_otp_key(normalized))
    return user
