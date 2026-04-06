import { useMemo } from "react";
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
function colorAt(i) {
  return CATEGORY_PIE_HEX[i % CATEGORY_PIE_HEX.length];
}

function LegendRow({ row, i, total }) {
  const share = total > 0 ? (row.value / total) * 100 : 0;
  const pctLabel = share >= 10 ? `${Math.round(share)}%` : `${share.toFixed(1)}%`;
  return (
    <li className="flex min-w-0 items-center gap-2.5 text-left text-xs">
      <span
        className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/80"
        style={{ backgroundColor: colorAt(i) }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{row.name}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">{pctLabel}</span>
      <span className="shrink-0 tabular-nums text-foreground">{formatRupeesCompact(row.value)}</span>
    </li>
  );
}

export function CategoryExpensePieChart({ data, className, variant = "pie" }) {
  const total = sumPieValues(data);

  const { left, right, splitAt } = useMemo(() => {
    if (data.length <= 1) {
      return { left: data, right: [], splitAt: 0 };
    }
    const mid = Math.ceil(data.length / 2);
    return { left: data.slice(0, mid), right: data.slice(mid), splitAt: mid };
  }, [data]);

  return (
    <div
      className={cn(
        "category-donut-chart dashboard-chart-shell flex w-full flex-col gap-4 [&_.recharts-pie-sector]:outline-none",
        className,
      )}
    >
      <DonutChart
        className="h-48 shrink-0 sm:h-52"
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

      {data.length > 0 ? (
        <div
          className="flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-stretch sm:gap-0"
          aria-label="Category legend"
        >
          <ul className="min-w-0 flex-1 space-y-2.5">
            {left.map((row, j) => (
              <LegendRow key={`${row.name}-${j}`} row={row} i={j} total={total} />
            ))}
          </ul>

          {right.length > 0 ? (
            <>
              <div
                className="hidden w-px shrink-0 bg-border sm:mx-3 sm:block"
                aria-hidden
                role="presentation"
              />
              <ul className="min-w-0 flex-1 space-y-2.5">
                {right.map((row, j) => (
                  <LegendRow key={`${row.name}-${splitAt + j}`} row={row} i={splitAt + j} total={total} />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
