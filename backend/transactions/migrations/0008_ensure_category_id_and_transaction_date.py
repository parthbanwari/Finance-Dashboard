"""
Ensure `category_id` and `transaction_date` exist on `transactions_transaction`.

Uses SHOW COLUMNS (case-insensitive) because information_schema lookups can miss
columns on some MySQL configurations, causing earlier repairs to no-op incorrectly.

Idempotent: safe to run when columns already exist.
MySQL only.
"""

from django.db import connection, migrations


def _mysql_column_names_lower(cursor, table: str) -> set[str]:
    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
    return {row[0].lower() for row in cursor.fetchall()}


def _mysql_exact_column_name(cursor, table: str, lower_name: str) -> str | None:
    cursor.execute(f"SHOW COLUMNS FROM `{table}`")
    for row in cursor.fetchall():
        if row[0].lower() == lower_name:
            return row[0]
    return None


def _mysql_fk_exists(cursor, constraint_name: str) -> bool:
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME = %s
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        """,
        [constraint_name],
    )
    return cursor.fetchone()[0] > 0


def _mysql_index_exists(cursor, table: str, index_name: str) -> bool:
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.statistics
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s
        """,
        [table, index_name],
    )
    return cursor.fetchone()[0] > 0


def ensure_columns(apps, schema_editor):
    if connection.vendor != "mysql":
        return

    table = "transactions_transaction"
    fk_name = "transactions_transac_category_id_c06a92e3_fk_transacti"

    with connection.cursor() as cursor:
        cols = _mysql_column_names_lower(cursor, table)
        has_cat = "category_id" in cols
        has_td = "transaction_date" in cols

        if has_cat and has_td:
            return

        cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
        n = int(cursor.fetchone()[0])
        if n > 0 and (not has_cat or not has_td):
            cursor.execute(f"DELETE FROM `{table}`")

        cols = _mysql_column_names_lower(cursor, table)

        cat_legacy = _mysql_exact_column_name(cursor, table, "category")
        if cat_legacy:
            cursor.execute(
                f"ALTER TABLE `{table}` DROP COLUMN `{cat_legacy}`"
            )
            cols = _mysql_column_names_lower(cursor, table)

        occ = _mysql_exact_column_name(cursor, table, "occurred_at")
        if occ and "transaction_date" not in cols:
            cursor.execute(
                f"ALTER TABLE `{table}` CHANGE COLUMN `{occ}` "
                f"`transaction_date` DATE NOT NULL"
            )
            cols = _mysql_column_names_lower(cursor, table)

        if "transaction_date" not in cols:
            cursor.execute(
                f"ALTER TABLE `{table}` ADD COLUMN `transaction_date` DATE NOT NULL"
            )
            cols = _mysql_column_names_lower(cursor, table)

        if "category_id" not in cols:
            cursor.execute(
                f"ALTER TABLE `{table}` ADD COLUMN `category_id` BIGINT NOT NULL"
            )
            if not _mysql_fk_exists(cursor, fk_name):
                cursor.execute(
                    "ALTER TABLE `transactions_transaction` "
                    f"ADD CONSTRAINT `{fk_name}` "
                    "FOREIGN KEY (`category_id`) REFERENCES `transactions_category` (`id`)"
                )

        if not _mysql_index_exists(cursor, table, "tx_user_cat_date_idx"):
            cursor.execute(
                "CREATE INDEX `tx_user_cat_date_idx` ON `transactions_transaction` "
                "(`user_id`, `category_id`, `transaction_date`)"
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("transactions", "0007_repair_transaction_updated_at_column"),
    ]

    operations = [
        migrations.RunPython(ensure_columns, noop_reverse),
    ]
