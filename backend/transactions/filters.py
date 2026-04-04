from django_filters import rest_framework as filters

from transactions.models import Transaction


class TransactionFilter(filters.FilterSet):
    """Query params: date_from, date_to, category (id), type, currency."""

    date_from = filters.DateFilter(field_name="transaction_date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="transaction_date", lookup_expr="lte")
    category = filters.NumberFilter(field_name="category_id")
    type = filters.ChoiceFilter(field_name="type", choices=Transaction.TransactionType.choices)
    currency = filters.CharFilter(field_name="currency", lookup_expr="iexact")

    class Meta:
        model = Transaction
        fields = []
