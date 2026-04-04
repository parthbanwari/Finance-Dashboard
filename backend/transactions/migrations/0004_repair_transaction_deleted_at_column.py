"""
Repair databases where `transactions_transaction` exists without `deleted_at`.
The default manager filters `deleted_at IS NULL`, so the column must exist.

Safe to run when the column already exists (no-op).
"""

from django.db import connection, migrations


def _has_column(cursor, table: str, column: str) -> bool:
    vendor = connection.vendor
    if vendor == "mysql":
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
            """,
            [table, column],
        )
        return cursor.fetchone()[0] > 0
    if vendor == "postgresql":
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = %s
              AND column_name = %s
            """,
            [table, column],
        )
        return cursor.fetchone()[0] > 0
    if vendor == "sqlite":
        cursor.execute(f'PRAGMA table_info("{table}")')
        return any(row[1] == column for row in cursor.fetchall())
    return False


def add_deleted_at_if_missing(apps, schema_editor):
    Transaction = apps.get_model("transactions", "Transaction")
    table = Transaction._meta.db_table

    with connection.cursor() as cursor:
        if _has_column(cursor, table, "deleted_at"):
            return

        if connection.vendor == "mysql":
            # Match Django DateTimeField(6) for MySQL
            cursor.execute(
                f"ALTER TABLE `{table}` ADD COLUMN `deleted_at` DATETIME(6) NULL"
            )
        elif connection.vendor == "postgresql":
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN "deleted_at" TIMESTAMPTZ NULL'
            )
        elif connection.vendor == "sqlite":
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN "deleted_at" datetime NULL'
            )
        else:
            import warnings

            warnings.warn(
                "transactions.0004_repair: add `deleted_at` manually for this database if missing.",
                RuntimeWarning,
                stacklevel=2,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0003_repair_transaction_type_column"),
    ]

    operations = [
        migrations.RunPython(add_deleted_at_if_missing, noop_reverse),
    ]
