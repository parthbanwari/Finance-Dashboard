import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Outlet } from "react-router-dom";

import * as dashboardApi from "@/api/dashboardApi";
import * as transactionApi from "@/api/transactionApi";
import { useAuth } from "@/contexts/auth-context";
import { getAxiosErrorMessage } from "@/lib/errors";
import { APP_CURRENCY } from "@/lib/format";

function canAccessAnalytics(role) {
  return role === "analyst" || role === "admin";
}

function buildAnalyticsParams(dateFrom, dateTo, currency) {
  const p = {};
  if (dateFrom) p.date_from = dateFrom;
  if (dateTo) p.date_to = dateTo;
  if (currency) p.currency = currency;
  return p;
}

const DashboardDataContext = createContext(null);

export function DashboardDataProvider() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [recent, setRecent] = useState([]);
  const [analyticsForbidden, setAnalyticsForbidden] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(APP_CURRENCY);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const availableCurrencies = useMemo(() => {
    const keys = Object.keys(summary?.totals_by_currency ?? {});
    return keys.length ? keys.sort() : [APP_CURRENCY];
  }, [summary]);

  useEffect(() => {
    if (!summary?.totals_by_currency) return;
    const keys = Object.keys(summary.totals_by_currency);
    if (!keys.length) return;
    if (!keys.includes(selectedCurrency)) {
      setSelectedCurrency(keys[0] ?? APP_CURRENCY);
    }
  }, [summary, selectedCurrency]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      const params = buildAnalyticsParams(dateFrom, dateTo, filterCurrency || undefined);

      if (!canAccessAnalytics(user?.role)) {
        setAnalyticsForbidden(true);
        setSummary(null);
        setCategoryBreakdown(null);
        setMonthlyTrends(null);
        try {
          const list = await transactionApi.listTransactions({
            page_size: 10,
            ordering: "-transaction_date",
          });
          if (!cancelled) {
            setRecent(list.results);
            setLoading(false);
          }
        } catch (e) {
          if (!cancelled) {
            setError(getAxiosErrorMessage(e));
            setRecent([]);
            setLoading(false);
          }
        }
        return;
      }

      setAnalyticsForbidden(false);
      try {
        const [s, c, m, r] = await Promise.all([
          dashboardApi.getSummary(params),
          dashboardApi.getCategoryBreakdown(params),
          dashboardApi.getMonthlyTrends(params),
          dashboardApi.getRecentTransactions({ ...params, limit: 10 }),
        ]);
        if (!cancelled) {
          setSummary(s);
          setCategoryBreakdown(c);
          setMonthlyTrends(m);
          setRecent(r.results);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getAxiosErrorMessage(e));
          setSummary(null);
          setCategoryBreakdown(null);
          setMonthlyTrends(null);
          setRecent([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, dateFrom, dateTo, filterCurrency, tick]);

  const value = useMemo(
    () => ({
      loading,
      error,
      summary,
      categoryBreakdown,
      monthlyTrends,
      recent,
      analyticsForbidden,
      dateFrom,
      dateTo,
      filterCurrency,
      setDateFrom,
      setDateTo,
      setFilterCurrency,
      selectedCurrency,
      setSelectedCurrency,
      availableCurrencies,
      refetch,
    }),
    [
      loading,
      error,
      summary,
      categoryBreakdown,
      monthlyTrends,
      recent,
      analyticsForbidden,
      dateFrom,
      dateTo,
      filterCurrency,
      selectedCurrency,
      availableCurrencies,
      refetch,
    ],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      <Outlet />
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return ctx;
}
