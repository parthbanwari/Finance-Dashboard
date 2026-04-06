import { AreaChart } from "@tremor/react";

import { AreaChartDarkTooltip } from "@/features/dashboard/components/tremor-dark-tooltips";
import { AREA_INCOME_EXPENSE_HEX } from "@/features/dashboard/lib/chart-theme";
import { formatRupeesCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const BALANCE_COLOR = [AREA_INCOME_EXPENSE_HEX[0]];

/**
 * Running balance after each transaction (chronological). Index field is `label`.
 *
 * @param {object} props
 * @param {{ label: string, Balance: number, delta?: string, type?: string }[]} props.data
 * @param {string} [props.className]
 */
export function MonthlyCashFlowChart({ data, className }) {
  return (
    <div className={cn("dashboard-chart-shell w-full pb-1", className)}>
      <AreaChart
        className="h-64 sm:h-80"
        data={data}
        index="label"
        categories={["Balance"]}
        colors={BALANCE_COLOR}
        yAxisWidth={82}
        showLegend={false}
        curveType="monotone"
        autoMinValue
        allowDecimals={false}
        showTooltip
        customTooltip={AreaChartDarkTooltip}
        valueFormatter={(v) => formatRupeesCompact(v)}
        noDataText="No transactions in this period."
        showAnimation
        animationDuration={800}
        connectNulls
        showGradient
        rotateLabelX={{
          xAxisHeight: 56,
          verticalShift: 10,
        }}
        tickGap={10}
      />
    </div>
  );
}
