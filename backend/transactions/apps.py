from django.apps import AppConfig


class TransactionsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "transactions"
    verbose_name = "Transactions"
