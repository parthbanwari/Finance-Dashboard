"""Auto-inactivate accounts with no sign-in activity for a configured period."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from users.models import User


def inactive_after_days() -> int:
    return max(1, int(getattr(settings, "INACTIVE_AFTER_DAYS", 7)))


def _exempt(user: User) -> bool:
    if user.is_staff or user.is_superuser:
        return True
    return getattr(user, "role", None) == User.Role.ADMIN


def activity_reference(user: User):
    """Latest known activity time: last login, or account creation if never logged in."""
    return user.last_login or user.date_joined


def is_stale(user: User) -> bool:
    if _exempt(user):
        return False
    ref = activity_reference(user)
    if ref is None:
        return False
    return timezone.now() - ref > timedelta(days=inactive_after_days())


def touch_last_login(user: User) -> None:
    """Record a successful sign-in or token refresh as activity."""
    now = timezone.now()
    user.last_login = now
    user.save(update_fields=["last_login"])


def deactivate_for_inactivity(user: User) -> None:
    user.is_active = False
    user.save(update_fields=["is_active", "updated_at"])


def deactivate_stale_users_batch() -> int:
    """
    Set is_active=False for all stale users. Returns count updated.
    For users who never call the API again, this keeps the admin team list accurate.
    """
    qs = (
        User.objects.filter(is_active=True)
        .exclude(is_staff=True)
        .exclude(is_superuser=True)
        .exclude(role=User.Role.ADMIN)
    )
    n = 0
    for user in qs.iterator():
        if is_stale(user):
            deactivate_for_inactivity(user)
            n += 1
    return n
