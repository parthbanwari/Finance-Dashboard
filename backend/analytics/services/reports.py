"""
Financial analytics builders — all aggregations run as **database-level** GROUP BY / SUM,
not Python loops over rows (scalable for dashboard loads).

Patterns used:
  - `.values(...).annotate(Sum(Case(...)))` → one round-trip per report shape
  - `select_related("category")` for recent lists → one JOIN, no per-row category queries
  - `transaction_count` folded into currency breakdown → avoids a separate COUNT(*) query
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from django.db.models import Count
from django.db.models.functions import TruncMonth

from analytics.services.aggregations import expense_amount_sum, income_amount_sum
from analytics.services.query_params import filtered_transactions


def _dec(v) -> Decimal:
    return v if v is not None else Decimal("0")


def _month_to_iso(m: date | datetime | None) -> str | None:
    """TruncMonth returns datetime on some backends and date on others (e.g. SQLite)."""
    if m is None:
        return None
    if isinstance(m, datetime):
        return m.date().isoformat()
    return m.isoformat()


def _filters_payload(request):
    return {
        "date_from": request.query_params.get("date_from"),
        "date_to": request.query_params.get("date_to"),
        "currency": request.query_params.get("currency"),
    }


def build_summary(user, request):
    """
    Per-currency income, expenses, net, and transaction counts in **one** grouped query.
    Total row count = sum of per-currency counts (same as global COUNT for this queryset).
    """
    qs = filtered_transactions(user, request)
    rows = qs.values("currency").annotate(
        total_income=income_amount_sum(),
        total_expenses=expense_amount_sum(),
        transaction_count=Count("id"),
    )
    totals_by_currency = {}
    total_transaction_count = 0
    for r in rows:
        cur = r["currency"]
        inc = _dec(r["total_income"])
        exp = _dec(r["total_expenses"])
        cnt = r["transaction_count"] or 0
        total_transaction_count += cnt
        totals_by_currency[cur] = {
            "total_income": str(inc),
            "total_expenses": str(exp),
            "net_balance": str(inc - exp),
            "transaction_count": cnt,
        }
    return {
        "totals_by_currency": totals_by_currency,
        "transaction_count": total_transaction_count,
        "filters_applied": _filters_payload(request),
    }


def build_category_breakdown(user, request):
    """
    One grouped query: category_id + category name + income/expense sums.
    JOIN to category is implicit via values("category__name"); no N+1.
    """
    qs = filtered_transactions(user, request)
    rows = (
        qs.values("category_id", "category__name")
        .annotate(
            total_income=income_amount_sum(),
            total_expenses=expense_amount_sum(),
            transaction_count=Count("id"),
        )
        .order_by("category__name")
    )
    results = []
    for r in rows:
        inc = _dec(r["total_income"])
        exp = _dec(r["total_expenses"])
        results.append(
            {
                "category_id": r["category_id"],
                "category_name": r["category__name"] or "",
                "total_income": str(inc),
                "total_expenses": str(exp),
                "net": str(inc - exp),
                "transaction_count": r["transaction_count"] or 0,
            }
        )
    return {
        "results": results,
        "filters_applied": _filters_payload(request),
    }


def build_monthly_trends(user, request):
    """
    Bucket by calendar month (DB TruncMonth on transaction_date) + sums — single query.
    """
    qs = filtered_transactions(user, request)
    rows = (
        qs.annotate(month=TruncMonth("transaction_date"))
        .values("month")
        .annotate(
            total_income=income_amount_sum(),
            total_expenses=expense_amount_sum(),
            transaction_count=Count("id"),
        )
        .order_by("month")
    )
    results = []
    for r in rows:
        m = r["month"]
        inc = _dec(r["total_income"])
        exp = _dec(r["total_expenses"])
        results.append(
            {
                "month": _month_to_iso(m),
                "total_income": str(inc),
                "total_expenses": str(exp),
                "net_balance": str(inc - exp),
                "transaction_count": r["transaction_count"] or 0,
            }
        )
    return {
        "results": results,
        "filters_applied": _filters_payload(request),
    }


def build_recent_transactions(user, request, limit: int):
    """
    Latest rows by business date — one query with JOIN to category (select_related).
    """
    qs = filtered_transactions(user, request).select_related("category").order_by(
        "-transaction_date",
        "-id",
    )[:limit]

    from transactions.serializers import TransactionSerializer

    serializer = TransactionSerializer(qs, many=True, context={"request": request})
    payload = serializer.data
    return {
        "results": payload,
        "count": len(payload),
        "limit": limit,
        "filters_applied": _filters_payload(request),
    }
