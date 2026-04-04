/**
 * Maps dashboard analytics payloads (see `dashboardApi.js`) to Tremor chart rows.
 */

import { formatShortMonthLabel } from "@/lib/format";

/**
 * One value per month: income minus spending (e.g. ₹25,000 in − ₹10,000 out = ₹15,000 on the line).
 * Rows are sorted by calendar month.
 *
 * @param {{ results?: { month?: string|null, total_income?: string, total_expenses?: string }[] } | null | undefined} monthlyTrends
 * @returns {{ month: string, Net: number }[]}
 */
export function mapMonthlyTrendsToNetLineData(monthlyTrends) {
  const rows = monthlyTrends?.results;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => {
    const ta = a.month ? new Date(a.month).getTime() : 0;
    const tb = b.month ? new Date(b.month).getTime() : 0;
    return ta - tb;
  });
  return sorted.map((r) => {
    const income = Math.max(0, Number.parseFloat(r.total_income ?? "0"));
    const spend = Math.max(0, Number.parseFloat(r.total_expenses ?? "0"));
    return {
      month: formatShortMonthLabel(r.month),
      Net: income - spend,
    };
  });
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
