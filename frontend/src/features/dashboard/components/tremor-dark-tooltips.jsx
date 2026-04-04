import { AREA_INCOME_EXPENSE_HEX, CATEGORY_PIE_HEX } from "@/features/dashboard/lib/chart-theme";
import { formatRupeesCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

function colorForSeriesEntry(entry) {
  const key = String(entry.dataKey ?? entry.name ?? "");
  if (key === "Income") return AREA_INCOME_EXPENSE_HEX[0];
  if (key === "Expense") return AREA_INCOME_EXPENSE_HEX[1];
  if (key === "Net") return AREA_INCOME_EXPENSE_HEX[0];
  const c = entry.color;
  return typeof c === "string" && c.startsWith("#") ? c : AREA_INCOME_EXPENSE_HEX[0];
}

function colorForDonutSlice(entry) {
  const raw = entry?.payload?.color ?? entry?.color;
  if (typeof raw === "string" && raw.startsWith("#")) return raw;
  return CATEGORY_PIE_HEX[0];
}

/**
 * Dark card-style tooltip for Tremor AreaChart — follows cursor; shows month + Income/Expense rows.
 */
export function AreaChartDarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p && p.type !== "none");
  if (!rows.length) return null;

  return (
    <div
      className={cn(
        "pointer-events-none z-50 min-w-[12rem] rounded-md border border-border/90",
        "bg-card/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm",
      )}
    >
      {label != null && String(label) !== "" ? (
        <p className="mb-1.5 border-b border-border/60 pb-1 text-xs font-medium text-foreground">{label}</p>
      ) : null}
      <div className="space-y-1.5">
        {rows.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? "");
          const rawName = entry.name ?? entry.dataKey ?? "—";
          const name = key === "Net" ? "Monthly net" : rawName;
          const v = entry.value;
          const n = typeof v === "number" ? v : Number.parseFloat(String(v));
          const color = colorForSeriesEntry(entry);
          const display =
            key === "Expense" && Number.isFinite(n)
              ? formatRupeesCompact(Math.abs(n))
              : Number.isFinite(n)
                ? formatRupeesCompact(n)
                : "—";
          return (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-6">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-border/60"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="truncate text-muted-foreground">{name}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-foreground">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact tooltip for Tremor DonutChart — category left, ₹ amount right (matches analytics reference).
 */
export function DonutChartDarkTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0];
  const name = p.name ?? p.payload?.name ?? "—";
  const v = p.value;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  const color = colorForDonutSlice(p);

  return (
    <div
      className={cn(
        "pointer-events-none z-50 min-w-[10rem] rounded-md border border-border/90",
        "bg-card/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm",
      )}
    >
      <div className="flex items-center justify-between gap-6">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-sm border border-border/60"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="truncate text-foreground">{name}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums text-foreground">
          {Number.isFinite(n) ? formatRupeesCompact(n) : "—"}
        </span>
      </div>
    </div>
  );
}
