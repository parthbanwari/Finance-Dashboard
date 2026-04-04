"""
Repair legacy `transactions_transaction` missing `updated_at` (required by model).

Safe no-op when the column already exists.
"""

from django.db import connection, migrations


def _has_column(cursor, table: str, column: str) -> bool:
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        [table, column],
    )
    return cursor.fetchone()[0] > 0


def add_updated_at_if_missing(apps, schema_editor):
    if connection.vendor != "mysql":
        return

    table = "transactions_transaction"
    with connection.cursor() as cursor:
        if _has_column(cursor, table, "updated_at"):
            return
        cursor.execute(
            f"ALTER TABLE `{table}` ADD COLUMN `updated_at` DATETIME(6) NOT NULL "
            f"DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("transactions", "0006_repair_transaction_legacy_columns"),
    ]

    operations = [
        migrations.RunPython(add_updated_at_if_missing, noop_reverse),
    ]
