from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mixins import EnvelopeMessageMixin
from core.openapi import (
    AnalyticsSummaryResponseSchema,
    CategoryBreakdownResponseSchema,
    MonthlyTrendsResponseSchema,
    RecentTransactionsResponseSchema,
    RunningBalanceSeriesResponseSchema,
    StandardErrorSchema,
)
from users.permissions import IsAnalystOrAdminForAnalytics

from analytics.services.cache import get_or_set_analytics_cache
from analytics.services.query_params import parse_limit
from analytics.services.reports import (
    build_category_breakdown,
    build_monthly_trends,
    build_recent_transactions,
    build_running_balance_series,
    build_summary,
)

ANALYTICS_FILTERS = [
    OpenApiParameter(
        "date_from",
        OpenApiTypes.DATE,
        OpenApiParameter.QUERY,
        description="Filter `transaction_date` >= this day (YYYY-MM-DD).",
    ),
    OpenApiParameter(
        "date_to",
        OpenApiTypes.DATE,
        OpenApiParameter.QUERY,
        description="Filter `transaction_date` <= this day (YYYY-MM-DD).",
    ),
]

RECENT_EXTRA = [
    OpenApiParameter(
        "limit",
        OpenApiTypes.INT,
        OpenApiParameter.QUERY,
        description="Max rows to return (default 20, max 100).",
    ),
]


@extend_schema(
    tags=["Analytics"],
    summary="Summary: income, expenses, net",
    description=(
        "**Analyst or Admin.** Returns per-currency totals (income and expenses as positive magnitudes), "
        "net balance, and transaction counts. Respects optional date filters."
    ),
    parameters=ANALYTICS_FILTERS,
    responses={
        200: OpenApiResponse(response=AnalyticsSummaryResponseSchema),
        401: OpenApiResponse(response=StandardErrorSchema),
        403: OpenApiResponse(response=StandardErrorSchema),
    },
)
class SummaryView(EnvelopeMessageMixin, APIView):
    permission_classes = [IsAuthenticated, IsAnalystOrAdminForAnalytics]

    def get_envelope_success_message(self):
        return "Financial summary retrieved successfully."

    def get(self, request):
        data = get_or_set_analytics_cache(
            user_id=request.user.id,
            endpoint_name="summary",
            request=request,
            builder=lambda: build_summary(request.user, request),
        )
        return Response(data)


@extend_schema(
    tags=["Analytics"],
    summary="Category breakdown",
    description="**Analyst or Admin.** Income, expense, and net per category for the filtered period.",
    parameters=ANALYTICS_FILTERS,
    responses={
        200: OpenApiResponse(response=CategoryBreakdownResponseSchema),
        401: OpenApiResponse(response=StandardErrorSchema),
        403: OpenApiResponse(response=StandardErrorSchema),
    },
)
class CategoryBreakdownView(APIView):
    permission_classes = [IsAuthenticated, IsAnalystOrAdminForAnalytics]

    def get(self, request):
        data = get_or_set_analytics_cache(
            user_id=request.user.id,
            endpoint_name="category_breakdown",
            request=request,
            builder=lambda: build_category_breakdown(request.user, request),
        )
        return Response(data)


@extend_schema(
    tags=["Analytics"],
    summary="Monthly trends",
    description="**Analyst or Admin.** Aggregates by calendar month (`TruncMonth` on `transaction_date`).",
    parameters=ANALYTICS_FILTERS,
    responses={
        200: OpenApiResponse(response=MonthlyTrendsResponseSchema),
        401: OpenApiResponse(response=StandardErrorSchema),
        403: OpenApiResponse(response=StandardErrorSchema),
    },
)
class MonthlyTrendsView(EnvelopeMessageMixin, APIView):
    permission_classes = [IsAuthenticated, IsAnalystOrAdminForAnalytics]

    def get_envelope_success_message(self):
        return "Monthly trends retrieved successfully."

    def get(self, request):
        data = get_or_set_analytics_cache(
            user_id=request.user.id,
            endpoint_name="monthly_trends",
            request=request,
            builder=lambda: build_monthly_trends(request.user, request),
        )
        return Response(data)


@extend_schema(
    tags=["Analytics"],
    summary="Running balance series (every transaction)",
    description=(
        "**Analyst or Admin.** Chronological list of transactions with cumulative **running_balance** "
        "after each row (income increases, expenses decrease). Same filters as other analytics. "
        "Use for cash-flow charts that step on every income/expense."
    ),
    parameters=ANALYTICS_FILTERS,
    responses={
        200: OpenApiResponse(response=RunningBalanceSeriesResponseSchema),
        401: OpenApiResponse(response=StandardErrorSchema),
        403: OpenApiResponse(response=StandardErrorSchema),
    },
)
class RunningBalanceSeriesView(EnvelopeMessageMixin, APIView):
    permission_classes = [IsAuthenticated, IsAnalystOrAdminForAnalytics]

    def get_envelope_success_message(self):
        return "Running balance series retrieved successfully."

    def get(self, request):
        data = get_or_set_analytics_cache(
            user_id=request.user.id,
            endpoint_name="running_balance_series",
            request=request,
            builder=lambda: build_running_balance_series(request.user, request),
        )
        return Response(data)


@extend_schema(
    tags=["Analytics"],
    summary="Recent transactions",
    description="**Analyst or Admin.** Latest rows by `transaction_date` for dashboard widgets; category is joined in one query.",
    parameters=ANALYTICS_FILTERS + RECENT_EXTRA,
    responses={
        200: OpenApiResponse(response=RecentTransactionsResponseSchema),
        401: OpenApiResponse(response=StandardErrorSchema),
        403: OpenApiResponse(response=StandardErrorSchema),
    },
)
class RecentTransactionsView(EnvelopeMessageMixin, APIView):
    permission_classes = [IsAuthenticated, IsAnalystOrAdminForAnalytics]

    def get_envelope_success_message(self):
        return "Recent transactions retrieved successfully."

    def get(self, request):
        limit = parse_limit(request)
        data = get_or_set_analytics_cache(
            user_id=request.user.id,
            endpoint_name=f"recent_transactions_{limit}",
            request=request,
            builder=lambda: build_recent_transactions(request.user, request, limit),
        )
        return Response(data)
