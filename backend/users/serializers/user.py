from rest_framework import serializers

from core.fields import ObjectIdStringField
from users.models import User


class UserSerializer(serializers.ModelSerializer):
    id = ObjectIdStringField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role")
        read_only_fields = ("id", "role")
