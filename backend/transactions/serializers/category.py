from rest_framework import serializers

from core.fields import ObjectIdStringField
from transactions.models import Category


class CategorySerializer(serializers.ModelSerializer):
    id = ObjectIdStringField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "created_at", "updated_at")
