"""
Reusable ORM expressions for income/expense analytics.

All sums use positive `amount` with `type` discriminating income vs expense
(see Transaction model). Keeps aggregation logic in one place for consistent dashboards.
"""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Case, DecimalField, F, Sum, Value, When

from transactions.models import Transaction


def income_amount_sum():
    """SQL: SUM(amount) WHERE type = income (else 0)."""
    return Sum(
        Case(
            When(type=Transaction.TransactionType.INCOME, then=F("amount")),
            default=Value(Decimal("0")),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
    )


def expense_amount_sum():
    """SQL: SUM(amount) WHERE type = expense (else 0)."""
    return Sum(
        Case(
            When(type=Transaction.TransactionType.EXPENSE, then=F("amount")),
            default=Value(Decimal("0")),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
    )
