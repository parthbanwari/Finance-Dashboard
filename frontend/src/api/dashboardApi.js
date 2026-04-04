import { apiClient } from "@/api/client";

/**
 * @typedef {Object} AnalyticsFiltersQuery
 * @property {string} [date_from]
 * @property {string} [date_to]
 * @property {string} [currency]
 */

/**
 * @typedef {Object} SummaryResponse
 * @property {Record<string, { total_income: string, total_expenses: string, net_balance: string, transaction_count: number }>} totals_by_currency
 * @property {number} transaction_count
 * @property {Record<string, string | undefined>} filters_applied
 */

/**
 * @typedef {Object} CategoryBreakdownRow
 * @property {number|null} category_id
 * @property {string} category_name
 * @property {string} total_income
 * @property {string} total_expenses
 * @property {string} net
 * @property {number} transaction_count
 */

/**
 * @typedef {Object} CategoryBreakdownResponse
 * @property {CategoryBreakdownRow[]} results
 * @property {Record<string, string | undefined>} filters_applied
 */

/**
 * @typedef {Object} MonthlyTrendRow
 * @property {string|null} month ISO date (month bucket)
 * @property {string} total_income
 * @property {string} total_expenses
 * @property {string} net_balance
 * @property {number} transaction_count
 */

/**
 * @typedef {Object} MonthlyTrendsResponse
 * @property {MonthlyTrendRow[]} results
 * @property {Record<string, string | undefined>} filters_applied
 */

/**
 * @typedef {Object} RecentTransactionsResponse
 * @property {unknown[]} results
 * @property {number} [count]
 * @property {number} [limit]
 * @property {Record<string, string | undefined>} filters_applied
 */

/** @param {AnalyticsFiltersQuery} [params] */
export async function getSummary(params) {
  const { data } = await apiClient.get("/analytics/summary/", {
    params,
  });
  return data;
}

/** @param {AnalyticsFiltersQuery} [params] */
export async function getCategoryBreakdown(params) {
  const { data } = await apiClient.get(
    "/analytics/summary/category-breakdown/",
    { params },
  );
  return data;
}

/** @param {AnalyticsFiltersQuery} [params] */
export async function getMonthlyTrends(params) {
  const { data } = await apiClient.get(
    "/analytics/summary/monthly-trends/",
    { params },
  );
  return data;
}

/** @param {AnalyticsFiltersQuery & { limit?: number }} [params] */
export async function getRecentTransactions(params) {
  const { data } = await apiClient.get(
    "/analytics/recent-transactions/",
    { params },
  );
  return data;
}
