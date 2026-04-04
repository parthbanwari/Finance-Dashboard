"""
Repair legacy `transactions_transaction` that still has:
  - varchar `category` instead of `category_id` FK
  - `occurred_at` instead of `transaction_date`

Deletes rows only when required (legacy columns or rows blocking NOT NULL / CHANGE).

Safe no-op when `category_id` and `transaction_date` already exist.
MySQL only (matches reported OperationalError environment).
"""

from django.db import connection, migrations


def _mysql_column_names(cursor, table: str) -> set[str]:
    cursor.execute(
        """
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
        """,
        [table],
    )
    return {row[0] for row in cursor.fetchall()}


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


def _row_count(cursor, table: str) -> int:
    cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
    return int(cursor.fetchone()[0])


def repair_transaction_columns(apps, schema_editor):
    if connection.vendor != "mysql":
        return

    table = "transactions_transaction"
    fk_name = "transactions_transac_category_id_c06a92e3_fk_transacti"

    with connection.cursor() as cursor:
        cols = _mysql_column_names(cursor, table)

        if "category_id" in cols and "transaction_date" in cols:
            return

        n = _row_count(cursor, table)

        legacy = "category" in cols or (
            "occurred_at" in cols and "transaction_date" not in cols
        )
        # Adding NOT NULL columns or reshaping legacy fields requires an empty table.
        if n > 0 and (
            legacy
            or "category_id" not in cols
            or "transaction_date" not in cols
        ):
            cursor.execute(f"DELETE FROM `{table}`")

        if "category" in cols:
            cursor.execute(f"ALTER TABLE `{table}` DROP COLUMN `category`")

        if "occurred_at" in cols and "transaction_date" not in cols:
            cursor.execute(
                f"ALTER TABLE `{table}` CHANGE COLUMN `occurred_at` "
                f"`transaction_date` DATE NOT NULL"
            )

        if "transaction_date" not in _mysql_column_names(cursor, table):
            cursor.execute(
                f"ALTER TABLE `{table}` ADD COLUMN `transaction_date` DATE NOT NULL"
            )

        cols = _mysql_column_names(cursor, table)
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
        ("transactions", "0005_repair_category_table"),
    ]

    operations = [
        migrations.RunPython(repair_transaction_columns, noop_reverse),
    ]
