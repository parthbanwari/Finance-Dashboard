"""Auth-related orchestration (e.g. post-login hooks) — extend as needed."""


def user_can_access_dashboard(user) -> bool:
    return user.is_authenticated and user.is_active
