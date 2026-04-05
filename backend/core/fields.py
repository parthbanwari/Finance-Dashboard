"""DRF fields for django-mongodb-backend primary keys (ObjectId)."""

from rest_framework import serializers


class ObjectIdStringField(serializers.CharField):
    """Expose MongoDB ObjectId primary keys as strings in JSON (not integers)."""

    def __init__(self, **kwargs):
        kwargs.setdefault("read_only", True)
        super().__init__(**kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        return str(value)
