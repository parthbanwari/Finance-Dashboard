/**
 * Maps dashboard analytics payloads (see `dashboardApi.js`) to Tremor chart rows.
 */

/**
 * Maps `/analytics/summary/running-balance-series/` to Tremor rows (one point per transaction).
 *
 * @param {{ results?: { label?: string, running_balance?: string, delta?: string, type?: string }[] } | null | undefined} payload
 * @returns {{ label: string, Balance: number, delta?: string, type?: string }[]}
 */
export function mapRunningBalanceSeriesToChartData(payload) {
  const rows = payload?.results;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((r) => ({
    label: r.label ?? r.transaction_date ?? "—",
    Balance: Number.parseFloat(r.running_balance ?? "0"),
    delta: r.delta,
    type: r.type,
  }));
}

/**
 * Expense magnitude per category (pie / donut). Zero slices are dropped.
 *
 * @param {{ results?: { category_name?: string, total_expenses?: string }[] } | null | undefined} categoryBreakdown
 * @returns {{ name: string, value: number }[]}
 */
export function mapCategoryBreakdownToPieData(categoryBreakdown) {
  const rows = categoryBreakdown?.results;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows
    .map((r) => ({
      name: r.category_name?.trim() || "Uncategorized",
      value: Number.parseFloat(r.total_expenses ?? "0"),
    }))
    .filter((d) => d.value > 0);
}

/** @param {{ value: number }[]} pieRows */
export function sumPieValues(pieRows) {
  return pieRows.reduce((acc, r) => acc + r.value, 0);
}
