"""Sign-in activity tracking (last_login display only — no auto-deactivation)."""

from __future__ import annotations

from django.utils import timezone

from users.models import User


def touch_last_login(user: User) -> None:
    """Record a successful sign-in or token refresh as activity."""
    now = timezone.now()
    user.last_login = now
    user.save(update_fields=["last_login"])
