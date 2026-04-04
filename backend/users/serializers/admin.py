from rest_framework import serializers

from users.models import User


class UserAdminSerializer(serializers.ModelSerializer):
    """Admin-only: read/update users (role, active flag)."""

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "username", "is_staff", "date_joined", "created_at", "updated_at")
