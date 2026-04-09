"""Analytics models."""

from django.conf import settings
from django.db import models


class UserAnalyticsNote(models.Model):
    """
    Persistent advisory text for a user, written by an analyst/admin.
    Viewer can read this on the analytics page.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analytics_note",
    )
    analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="written_analytics_notes",
    )
    note = models.TextField(blank=True)
    website_recommendation = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Analytics note for {self.user}"
