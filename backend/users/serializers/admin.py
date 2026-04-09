from rest_framework import serializers

from core.fields import ObjectIdStringField
from users.models import User


class UserAdminSerializer(serializers.ModelSerializer):
    """Admin-only: read/update users (role, active flag)."""

    id = ObjectIdStringField()

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
            "last_login",
            "date_joined",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "username",
            "is_staff",
            "last_login",
            "date_joined",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            request
            and self.instance
            and attrs.get("is_active") is False
            and self.instance.pk == request.user.pk
        ):
            raise serializers.ValidationError(
                {"is_active": "You cannot deactivate your own account."},
            )
        return attrs
