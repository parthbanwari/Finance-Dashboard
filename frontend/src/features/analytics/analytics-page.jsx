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
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { CategoryExpensePieChart } from "@/features/dashboard/components/category-expense-pie-chart";
import { MonthlyCashFlowChart } from "@/features/dashboard/components/monthly-cash-flow-chart";
import {
  mapCategoryBreakdownToPieData,
  mapRunningBalanceSeriesToChartData,
} from "@/features/dashboard/lib/map-analytics-charts";

export function AnalyticsPage() {
  const {
    loading,
    error,
    categoryBreakdown,
    runningBalanceSeries,
    analyticsForbidden,
  } = useDashboardData();

  const donutData = useMemo(
    () => mapCategoryBreakdownToPieData(categoryBreakdown),
    [categoryBreakdown],
  );

  const netLineData = useMemo(
    () => mapRunningBalanceSeriesToChartData(runningBalanceSeries),
    [runningBalanceSeries],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <p className="text-muted-foreground">
          Trends and category breakdowns — use the same filters as the dashboard.
        </p>
      </div>

      <DashboardFilters />

      {error ? <ErrorBlock message={error} /> : null}

      {!error && loading ? <LoadingBlock label="Loading analytics…" /> : null}

      {!error && !loading && analyticsForbidden ? (
        <EmptyBlock
          title="Analytics restricted"
          description="Analyst or Admin access is required to view these reports."
        />
      ) : null}

      {!error && !loading && !analyticsForbidden ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Category expense mix</CardTitle>
              <CardDescription>Share of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {donutData.length ? (
                <CategoryExpensePieChart data={donutData} variant="donut" />
              ) : (
                <EmptyBlock title="No data" description="No expenses in the selected period." />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Running balance</CardTitle>
              <CardDescription>
                Cumulative balance after each transaction in the filtered period (chronological order).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {netLineData.length ? (
                <MonthlyCashFlowChart data={netLineData} />
              ) : (
                <EmptyBlock title="No data" description="No transactions in range." />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
