import { LineChart } from "@tremor/react";

import { AreaChartDarkTooltip } from "@/features/dashboard/components/tremor-dark-tooltips";
import { AREA_INCOME_EXPENSE_HEX } from "@/features/dashboard/lib/chart-theme";
import { formatRupeesCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const NET_LINE_COLOR = [AREA_INCOME_EXPENSE_HEX[0]];

/**
 * Single line: monthly net = income − spending (e.g. ₹25k in and ₹10k out → point at ₹15k).
 *
 * @param {object} props
 * @param {{ month: string, Net: number }[]} props.data
 * @param {string} [props.className]
 */
export function MonthlyCashFlowChart({ data, className }) {
  return (
    <div className={cn("dashboard-chart-shell w-full", className)}>
      <LineChart
        className="h-64 sm:h-72"
        data={data}
        index="month"
        categories={["Net"]}
        colors={NET_LINE_COLOR}
        yAxisWidth={64}
        showLegend={false}
        curveType="monotone"
        autoMinValue
        allowDecimals={false}
        showTooltip
        customTooltip={AreaChartDarkTooltip}
        valueFormatter={(v) => formatRupeesCompact(v)}
        noDataText="No monthly data for this period."
        showAnimation
        animationDuration={700}
        connectNulls
      />
    </div>
  );
}
