"""
Repair databases where `transactions_category` was never created (1146).

Uses the schema editor so indexes, unique constraints, and FK to users_user
match Django's migration state.

Safe to run when the table already exists (no-op).
"""

from django.db import migrations


def add_category_table_if_missing(apps, schema_editor):
    connection = schema_editor.connection
    Category = apps.get_model("transactions", "Category")
    table = Category._meta.db_table

    with connection.cursor() as cursor:
        names = connection.introspection.table_names(cursor)
        if table in names:
            return

    schema_editor.create_model(Category)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    # MySQL: CREATE TABLE cannot run inside an atomic migration block.
    atomic = False

    dependencies = [
        ("transactions", "0004_repair_transaction_deleted_at_column"),
    ]

    operations = [
        migrations.RunPython(add_category_table_if_missing, noop_reverse),
    ]
