from users.models import User


def set_role(user: User, role: str) -> None:
    """Assign role — call from admin actions or management commands."""
    if role not in User.Role.values:
        raise ValueError("invalid role")
    user.role = role
    user.save(update_fields=["role"])
