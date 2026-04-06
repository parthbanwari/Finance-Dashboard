"""
Create or update three demo accounts (viewer, analyst, admin).

API sign-in: email + DEMO_LOGIN_PASSWORD (same for all; see .env).
Django admin: admin_demo user has staff/superuser; same password works there too.

Usage:
  python manage.py create_demo_users
  python manage.py create_demo_users --password "my-shared-secret"
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


# Fixed demo identities — safe for local/assessment; change in production if needed.
DEMO_SPECS = (
    {
        "username": "viewer_demo",
        "email": "viewer@demo.finance",
        "role": "viewer",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "analyst_demo",
        "email": "analyst@demo.finance",
        "role": "analyst",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "admin_demo",
        "email": "admin@demo.finance",
        "role": "admin",
        "is_staff": True,
        "is_superuser": True,
    },
)


class Command(BaseCommand):
    help = "Create or update demo users (viewer, analyst, admin) for assessment / local dev."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default="",
            help="Password to store (hashed) and must match DEMO_LOGIN_PASSWORD for API login. "
            "Defaults to DEMO_LOGIN_PASSWORD from the environment.",
        )

    def handle(self, *args, **options):
        raw = (options.get("password") or "").strip()
        demo_pw = raw or getattr(settings, "DEMO_LOGIN_PASSWORD", "") or ""
        if not demo_pw:
            self.stderr.write(
                self.style.ERROR(
                    "No password: set DEMO_LOGIN_PASSWORD in .env or pass --password."
                )
            )
            return

        User = get_user_model()
        created_n = 0
        updated_n = 0

        for spec in DEMO_SPECS:
            user, created = User.objects.update_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "role": spec["role"],
                    "is_active": True,
                    "is_staff": spec["is_staff"],
                    "is_superuser": spec["is_superuser"],
                    "first_name": spec["role"].title(),
                    "last_name": "Demo",
                },
            )
            user.set_password(demo_pw)
            user.save(update_fields=["password"])
            if created:
                created_n += 1
            else:
                updated_n += 1

            action = "Created" if created else "Updated"
            self.stdout.write(
                f"  {action}: {user.email} ({user.role}) — username `{user.username}`"
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_n} created, {updated_n} updated. "
                "Sign in via API with the email above and DEMO_LOGIN_PASSWORD."
            )
        )
        self.stdout.write("")
        self.stdout.write("  viewer@demo.finance   → Viewer")
        self.stdout.write("  analyst@demo.finance  → Analyst")
        self.stdout.write("  admin@demo.finance    → Admin (Django admin + Team page)")
        self.stdout.write("")
