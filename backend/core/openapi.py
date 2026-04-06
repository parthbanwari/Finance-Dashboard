"""Reusable OpenAPI response shapes for drf-spectacular (analytics JSON bodies)."""

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

TokenPairResponseSchema = inline_serializer(
    name="TokenPairResponse",
    fields={
        "access": serializers.CharField(help_text="JWT access token (Bearer)"),
        "refresh": serializers.CharField(help_text="JWT refresh token"),
    },
)

# Use JSONField for nested structures — avoids inline_serializer nesting quirks with ListField children.

AnalyticsSummaryResponseSchema = inline_serializer(
    name="AnalyticsSummaryResponse",
    fields={
        "totals_by_currency": serializers.JSONField(
            help_text="Per currency: total_income, total_expenses, net_balance, transaction_count"
        ),
        "transaction_count": serializers.IntegerField(),
        "filters_applied": serializers.JSONField(),
    },
)

CategoryBreakdownResponseSchema = inline_serializer(
    name="CategoryBreakdownResponse",
    fields={
        "results": serializers.JSONField(help_text="List of per-category aggregates"),
        "filters_applied": serializers.JSONField(),
    },
)

MonthlyTrendsResponseSchema = inline_serializer(
    name="MonthlyTrendsResponse",
    fields={
        "results": serializers.JSONField(help_text="List of monthly buckets"),
        "filters_applied": serializers.JSONField(),
    },
)

RecentTransactionsResponseSchema = inline_serializer(
    name="RecentTransactionsResponse",
    fields={
        "results": serializers.JSONField(help_text="Serialized transactions (nested category)"),
        "count": serializers.IntegerField(),
        "limit": serializers.IntegerField(),
        "filters_applied": serializers.JSONField(),
    },
)

RunningBalanceSeriesResponseSchema = inline_serializer(
    name="RunningBalanceSeriesResponse",
    fields={
        "results": serializers.JSONField(
            help_text="Per transaction: label, running_balance, delta, type, transaction_date, …"
        ),
        "point_count": serializers.IntegerField(),
        "filters_applied": serializers.JSONField(),
    },
)

StandardErrorSchema = inline_serializer(
    name="StandardError",
    fields={
        "code": serializers.IntegerField(help_text="0 for failed requests"),
        "message": serializers.CharField(),
        "data": serializers.JSONField(
            allow_null=True,
            help_text="Validation / detail payload, or null",
        ),
    },
)

StandardSuccessEnvelopeSchema = inline_serializer(
    name="StandardSuccessEnvelope",
    fields={
        "code": serializers.IntegerField(help_text="1 for success"),
        "message": serializers.CharField(),
        "data": serializers.JSONField(help_text="Endpoint payload (list, object, or paginated shape)"),
    },
)
