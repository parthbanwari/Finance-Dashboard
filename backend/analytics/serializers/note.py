from rest_framework import serializers

from analytics.models import UserAnalyticsNote
from core.fields import ObjectIdStringField


class UserAnalyticsNoteSerializer(serializers.ModelSerializer):
    id = ObjectIdStringField()
    user_id = ObjectIdStringField()
    analyst_id = ObjectIdStringField()
    analyst_name = serializers.SerializerMethodField()

    class Meta:
        model = UserAnalyticsNote
        fields = (
            "id",
            "user_id",
            "analyst_id",
            "analyst_name",
            "note",
            "website_recommendation",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user_id",
            "analyst_id",
            "analyst_name",
            "updated_at",
        )

    def get_analyst_name(self, obj):
        analyst = getattr(obj, "analyst", None)
        if not analyst:
            return None
        full = f"{(analyst.first_name or '').strip()} {(analyst.last_name or '').strip()}".strip()
        if full:
            return full
        return analyst.username or analyst.email
