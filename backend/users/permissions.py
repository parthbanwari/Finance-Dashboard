"""
Role-based access control for DRF.

Use these on views via `permission_classes`. Combine with queryset scoping
(`get_queryset`) so list endpoints never leak other users' rows.
"""

from __future__ import annotations

from rest_framework import permissions

from users.models import User


def get_role(user) -> str | None:
    if not user or not user.is_authenticated:
        return None
    return getattr(user, "role", None)


# --- Role shortcuts (request-level) ---


class IsAdmin(permissions.BasePermission):
    """Admin only — user management, destructive operations."""

    message = "Admin role required."

    def has_permission(self, request, view) -> bool:
        if request.method == "OPTIONS":
            return True
        return get_role(request.user) == User.Role.ADMIN


class IsAnalystOrAdmin(permissions.BasePermission):
    """Analyst or Admin — writes on operational data, analytics."""

    message = "Analyst or Admin role required."

    def has_permission(self, request, view) -> bool:
        return get_role(request.user) in (User.Role.ANALYST, User.Role.ADMIN)


class IsAnalystOrAdminForAnalytics(permissions.BasePermission):
    """
    Backwards-compatible name: allow all authenticated app roles to view analytics.
    Viewers stay read-only because write endpoints still use stricter permissions.
    """

    message = "Authenticated role required to access analytics."

    def has_permission(self, request, view) -> bool:
        if request.method == "OPTIONS":
            return True
        return get_role(request.user) in (
            User.Role.VIEWER,
            User.Role.ANALYST,
            User.Role.ADMIN,
        )


class IsAnyAuthenticatedRole(permissions.BasePermission):
    """Viewer, Analyst, or Admin."""

    def has_permission(self, request, view) -> bool:
        return get_role(request.user) in (
            User.Role.VIEWER,
            User.Role.ANALYST,
            User.Role.ADMIN,
        )


# --- Object-level: own financial data ---


class IsOwnerOfResource(permissions.BasePermission):
    """
    Object must belong to request.user (FK `user`).
    Use with Transaction and Category.
    """

    message = "You do not have access to this resource."

    def has_object_permission(self, request, view, obj) -> bool:
        owner_id = getattr(obj, "user_id", None)
        if owner_id is None and hasattr(obj, "user"):
            owner_id = obj.user_id
        return owner_id is not None and owner_id == request.user.id


class MeObjectPermission(permissions.BasePermission):
    """Profile endpoints: only the authenticated user may access their record."""

    message = "You can only access your own profile."

    def has_permission(self, request, view) -> bool:
        if request.method == "OPTIONS":
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        return obj.pk == request.user.pk


# --- Composite permissions for viewsets ---


class TransactionPermission(permissions.BasePermission):
    """
    Transactions: Viewer read-only; Analyst create/update; Admin destroy (soft).
    Object-level: always owner-only (no cross-user access).
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view) -> bool:
        if request.method == "OPTIONS":
            return True
        role = get_role(request.user)
        if role not in (
            User.Role.VIEWER,
            User.Role.ANALYST,
            User.Role.ADMIN,
        ):
            return False
        action = getattr(view, "action", None)
        if action in ("list", "retrieve"):
            return True
        if action == "create":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action == "destroy":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action in ("update", "partial_update"):
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        return False

    def has_object_permission(self, request, view, obj) -> bool:
        if not hasattr(obj, "user_id") or obj.user_id != request.user.id:
            return False
        role = get_role(request.user)
        action = getattr(view, "action", None)
        if action == "retrieve":
            return True
        if action == "destroy":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action in ("update", "partial_update"):
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        return False


class CategoryPermission(permissions.BasePermission):
    """Categories: same role rules as transactions; owner-scoped objects."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view) -> bool:
        if request.method == "OPTIONS":
            return True
        role = get_role(request.user)
        if role not in (
            User.Role.VIEWER,
            User.Role.ANALYST,
            User.Role.ADMIN,
        ):
            return False
        action = getattr(view, "action", None)
        if action in ("list", "retrieve"):
            return True
        if action == "create":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action == "destroy":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action in ("update", "partial_update"):
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        return False

    def has_object_permission(self, request, view, obj) -> bool:
        if not hasattr(obj, "user_id") or obj.user_id != request.user.id:
            return False
        role = get_role(request.user)
        action = getattr(view, "action", None)
        if action == "retrieve":
            return True
        if action == "destroy":
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        if action in ("update", "partial_update"):
            return role in (User.Role.ANALYST, User.Role.ADMIN)
        return False


# Backwards-compatible names (older imports)
IsAnalystOrAbove = IsAnalystOrAdmin
