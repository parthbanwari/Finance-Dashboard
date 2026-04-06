from django.urls import path

from analytics.views import (
    CategoryBreakdownView,
    MonthlyTrendsView,
    RecentTransactionsView,
    RunningBalanceSeriesView,
    SummaryView,
)

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="analytics-summary"),
    path(
        "summary/category-breakdown/",
        CategoryBreakdownView.as_view(),
        name="analytics-category-breakdown",
    ),
    path(
        "summary/running-balance-series/",
        RunningBalanceSeriesView.as_view(),
        name="analytics-running-balance-series",
    ),
    path(
        "summary/monthly-trends/",
        MonthlyTrendsView.as_view(),
        name="analytics-monthly-trends",
    ),
    path(
        "recent-transactions/",
        RecentTransactionsView.as_view(),
        name="analytics-recent-transactions",
    ),
]
