from __future__ import annotations

from django.db.models import QuerySet

from transactions.models import Transaction
from transactions.services.transaction import queryset_for_user


def filtered_transactions(user, request) -> QuerySet[Transaction]:
    """
    Base queryset for analytics: scoped to user, non-deleted, with optional filters.

    Query params:
      - date_from, date_to: filter transaction_date (inclusive)
      - currency: filter to one ISO currency code
    """
    qs = queryset_for_user(user)
    params = request.query_params
    date_from = params.get("date_from")
    date_to = params.get("date_to")
    currency = params.get("currency")
    if date_from:
        qs = qs.filter(transaction_date__gte=date_from)
    if date_to:
        qs = qs.filter(transaction_date__lte=date_to)
    if currency:
        qs = qs.filter(currency__iexact=currency.strip())
    return qs


def parse_limit(request, default: int = 20, max_limit: int = 100) -> int:
    """Recent-transactions page size — bounded to avoid large payloads."""
    raw = request.query_params.get("limit", str(default))
    try:
        n = int(raw)
    except (TypeError, ValueError):
        n = default
    return max(1, min(n, max_limit))
