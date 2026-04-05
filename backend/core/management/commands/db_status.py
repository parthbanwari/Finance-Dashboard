"""
Print database connection info and whether core tables/collections exist.

Run: python manage.py db_status
"""

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Show DB engine, database name, and transactions_* tables or collections."

    def handle(self, *args, **options):
        cfg = connection.settings_dict
        self.stdout.write(f"ENGINE: {cfg.get('ENGINE')}")
        self.stdout.write(f"NAME:   {cfg.get('NAME')}")
        self.stdout.write(f"HOST:   {cfg.get('HOST')!r} PORT: {cfg.get('PORT')!r}")
        self.stdout.write("")

        vendor = connection.vendor
        if vendor == "mongodb":
            db = connection.database
            self.stdout.write(f"MongoDB database: {db.name!r}")
            names = [doc["name"] for doc in db.list_collections()]
            tx = sorted(n for n in names if str(n).startswith("transactions_"))
            self.stdout.write(f"Collections matching 'transactions_*': {len(tx)}")
            for name in tx:
                self.stdout.write(f"  - {name}")
            need = {"transactions_category", "transactions_transaction"}
            missing = need - set(tx)
            if missing:
                self.stdout.write(
                    self.style.ERROR(
                        f"MISSING COLLECTIONS (after migrate): {sorted(missing)}"
                    )
                )
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "If collections are missing, run: python manage.py migrate"
                )
            )
            return

        with connection.cursor() as cursor:
            if vendor == "mysql":
                cursor.execute("SELECT DATABASE()")
                self.stdout.write(f"MySQL current database: {cursor.fetchone()[0]!r}")
                cursor.execute(
                    "SHOW TABLES LIKE %s",
                    ["transactions_%"],
                )
                rows = cursor.fetchall()
                self.stdout.write(f"Tables matching 'transactions_%': {len(rows)}")
                for r in rows:
                    self.stdout.write(f"  - {r[0]}")
                cursor.execute(
                    """
                    SELECT COLUMN_NAME FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions_transaction'
                    ORDER BY ORDINAL_POSITION
                    """
                )
                cols = [x[0] for x in cursor.fetchall()]
                self.stdout.write(f"Columns on transactions_transaction: {cols}")

                found_tables = {r[0] for r in rows}
                need = {"transactions_category", "transactions_transaction"}
                missing_tables = need - found_tables
                if missing_tables:
                    self.stdout.write(
                        self.style.ERROR(
                            f"MISSING TABLES (Django expects both): {sorted(missing_tables)}"
                        )
                    )
                if "occurred_at" in cols and "transaction_date" not in cols:
                    self.stdout.write(
                        self.style.ERROR(
                            "LEGACY SCHEMA DETECTED: column 'occurred_at' found but "
                            "'transaction_date' missing. This is NOT the current Django model. "
                            "Drop/recreate the database and run: python manage.py migrate"
                        )
                    )
                if "category_id" not in cols and "category" in cols:
                    self.stdout.write(
                        self.style.ERROR(
                            "LEGACY SCHEMA: 'category' is a column; current model uses "
                            "ForeignKey -> transactions_category (category_id)."
                        )
                    )
                if "deleted_at" not in cols:
                    self.stdout.write(
                        self.style.ERROR(
                            "MISSING COLUMN: deleted_at (required for soft-delete / default queryset). "
                            "Run: python manage.py migrate"
                        )
                    )
            elif vendor == "sqlite":
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'transactions_%'"
                )
                for r in cursor.fetchall():
                    self.stdout.write(f"  - {r[0]}")
            elif vendor == "postgresql":
                cursor.execute(
                    """
                    SELECT table_name FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name LIKE 'transactions_%%'
                    """
                )
                for r in cursor.fetchall():
                    self.stdout.write(f"  - {r[0]}")

        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "If tables are missing or columns are wrong, run: python manage.py migrate"
            )
        )
        self.stdout.write(
            "If migrate says 'No migrations' but tables are still wrong, reset DB — see SETUP_DATABASE.txt"
        )
