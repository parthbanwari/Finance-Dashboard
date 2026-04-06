import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/feedback/api-state";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { CategoryExpensePieChart } from "@/features/dashboard/components/category-expense-pie-chart";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { MonthlyCashFlowChart } from "@/features/dashboard/components/monthly-cash-flow-chart";
import { RecentTransactionsTable } from "@/features/dashboard/components/recent-transactions-table";
import {
  mapCategoryBreakdownToPieData,
  mapRunningBalanceSeriesToChartData,
} from "@/features/dashboard/lib/map-analytics-charts";

export function DashboardPage() {
  const {
    loading,
    error,
    summary,
    categoryBreakdown,
    runningBalanceSeries,
    recent,
    analyticsForbidden,
  } = useDashboardData();

  const pieData = useMemo(
    () => mapCategoryBreakdownToPieData(categoryBreakdown),
    [categoryBreakdown],
  );

  const netLineData = useMemo(
    () => mapRunningBalanceSeriesToChartData(runningBalanceSeries),
    [runningBalanceSeries],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">
          Your financial snapshot — filters apply to KPIs, charts, and recent activity below.
        </p>
      </header>

      <DashboardFilters />

      {error ? <ErrorBlock message={error} /> : null}

      {!error ? (
        <KpiCards summary={summary} analyticsForbidden={analyticsForbidden} loading={loading} />
      ) : null}

      {!error && loading ? (
        <LoadingBlock label="Loading charts and activity…" />
      ) : null}

      {!error && !loading && !analyticsForbidden ? (
        <section aria-label="Analytics charts" className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Expenses by category</CardTitle>
              <CardDescription>
                Share of expense by category for the filtered period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length ? (
                <CategoryExpensePieChart data={pieData} />
              ) : (
                <EmptyBlock
                  title="No expense categories"
                  description="Add expense transactions or widen the date range."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Running balance</CardTitle>
              <CardDescription>
                One point per transaction in date order: balance updates after each income and
                expense in the filtered period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {netLineData.length ? (
                <MonthlyCashFlowChart data={netLineData} />
              ) : (
                <EmptyBlock title="No transactions" description="Try a wider date range." />
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {!error && !loading && analyticsForbidden ? (
        <EmptyBlock
          title="Charts unavailable"
          description="Your role can view transactions, but summary charts and totals need Analyst or Admin access."
        />
      ) : null}

      {!error && !loading ? (
        <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <CardDescription>
              {analyticsForbidden
                ? "Latest rows from your transaction list."
                : "Latest rows from analytics."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length ? (
              <RecentTransactionsTable
                transactions={recent}
                analyticsForbidden={analyticsForbidden}
              />
            ) : (
              <EmptyBlock title="No recent transactions" description="Create a transaction to see activity here." />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
