import { DonutChart } from "@tremor/react";

import { DonutChartDarkTooltip } from "@/features/dashboard/components/tremor-dark-tooltips";
import { CATEGORY_PIE_HEX } from "@/features/dashboard/lib/chart-theme";
import { sumPieValues } from "@/features/dashboard/lib/map-analytics-charts";
import { formatRupeesCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Expense share by category — pie or donut with explicit hex fills (visible on dark navy).
 *
 * @param {object} props
 * @param {{ name: string, value: number }[]} props.data
 * @param {"pie" | "donut"} [props.variant]
 * @param {string} [props.className]
 */
export function CategoryExpensePieChart({ data, className, variant = "pie" }) {
  const total = sumPieValues(data);

  return (
    <div className={cn("dashboard-chart-shell w-full [&_.recharts-pie-sector]:outline-none", className)}>
      <DonutChart
        className="h-56 sm:h-64"
        data={data}
        category="value"
        index="name"
        variant={variant}
        valueFormatter={(v) => formatRupeesCompact(v)}
        colors={CATEGORY_PIE_HEX}
        label={total > 0 ? formatRupeesCompact(total) : "—"}
        showLabel
        showTooltip
        customTooltip={DonutChartDarkTooltip}
        noDataText="No expense data for this period."
        showAnimation
        animationDuration={700}
      />
    </div>
  );
}
