from django.contrib import admin

from analytics.models import UserAnalyticsNote


@admin.register(UserAnalyticsNote)
class UserAnalyticsNoteAdmin(admin.ModelAdmin):
    list_display = ("user", "analyst", "updated_at")
    search_fields = ("user__email", "user__username", "analyst__email", "analyst__username")
