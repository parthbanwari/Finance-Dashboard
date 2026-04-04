from decimal import Decimal

from django.db.models import Case, DecimalField, F, QuerySet, Sum, When

from transactions.models import Transaction


def queryset_for_user(user) -> QuerySet[Transaction]:
    return Transaction.objects.filter(user=user)


def signed_amount_expression():
    """SQL expression: income adds, expense subtracts (amount stored positive)."""
    return Case(
        When(type=Transaction.TransactionType.EXPENSE, then=-F("amount")),
        default=F("amount"),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )


def total_by_currency(user) -> dict[str, Decimal]:
    rows = (
        queryset_for_user(user)
        .values("currency")
        .annotate(total=Sum(signed_amount_expression()))
    )
    return {r["currency"]: r["total"] or Decimal("0") for r in rows}
