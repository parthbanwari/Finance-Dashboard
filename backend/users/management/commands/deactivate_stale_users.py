"""
Mark non-admin users inactive when they exceed INACTIVE_AFTER_DAYS without login/refresh.

Schedule daily in production, e.g. cron:
  0 3 * * * cd /app/backend && python manage.py deactivate_stale_users
"""

from django.core.management.base import BaseCommand

from users.services import inactivity


class Command(BaseCommand):
    help = (
        "Set is_active=False for viewer/analyst accounts with no sign-in activity for "
        "INACTIVE_AFTER_DAYS (default 7). Staff, superusers, and role=admin are skipped."
    )

    def handle(self, *args, **options):
        n = inactivity.deactivate_stale_users_batch()
        self.stdout.write(self.style.SUCCESS(f"Deactivated {n} stale user(s)."))
