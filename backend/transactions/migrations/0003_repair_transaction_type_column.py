"""
Repair legacy / drifted databases where `transactions_transaction` exists
without the `type` column (causes OperationalError 1054 on analytics).

Safe to run when the column already exists (no-op).
"""

from django.db import connection, migrations


def _has_type_column(cursor, table: str) -> bool:
    vendor = connection.vendor
    if vendor == "mysql":
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = 'type'
            """,
            [table],
        )
        return cursor.fetchone()[0] > 0
    if vendor == "postgresql":
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = %s
              AND column_name = 'type'
            """,
            [table],
        )
        return cursor.fetchone()[0] > 0
    if vendor == "sqlite":
        cursor.execute(f'PRAGMA table_info("{table}")')
        return any(row[1] == "type" for row in cursor.fetchall())
    return False


def add_type_column_if_missing(apps, schema_editor):
    """Add `type` with a temporary default so existing rows are valid."""
    Transaction = apps.get_model("transactions", "Transaction")
    table = Transaction._meta.db_table

    with connection.cursor() as cursor:
        if _has_type_column(cursor, table):
            return

        if connection.vendor == "mysql":
            cursor.execute(
                f"ALTER TABLE `{table}` ADD COLUMN `type` VARCHAR(16) NOT NULL DEFAULT 'expense'"
            )
        elif connection.vendor == "postgresql":
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN "type" VARCHAR(16) NOT NULL DEFAULT \'expense\''
            )
        elif connection.vendor == "sqlite":
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN "type" varchar(16) NOT NULL DEFAULT \'expense\''
            )
        else:
            import warnings

            warnings.warn(
                "transactions.0003_repair: add `type` manually for this database if missing.",
                RuntimeWarning,
                stacklevel=2,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(add_type_column_if_missing, noop_reverse),
    ]
