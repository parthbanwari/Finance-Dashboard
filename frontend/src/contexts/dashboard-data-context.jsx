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
import { useAuth } from "@/contexts/auth-context";
import { getAxiosErrorMessage } from "@/lib/errors";

function canAccessAnalytics(role) {
  return role === "viewer" || role === "analyst" || role === "admin";
}

function buildAnalyticsParams(dateFrom, dateTo) {
  const p = {};
  if (dateFrom) p.date_from = dateFrom;
  if (dateTo) p.date_to = dateTo;
  return p;
}

const DashboardDataContext = createContext(null);

export function DashboardDataProvider() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [runningBalanceSeries, setRunningBalanceSeries] = useState(null);
  const [recent, setRecent] = useState([]);
  const [analyticsForbidden, setAnalyticsForbidden] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      const params = buildAnalyticsParams(dateFrom, dateTo);

      setAnalyticsForbidden(!canAccessAnalytics(user?.role));
      try {
        const [s, c, rb, r] = await Promise.all([
          dashboardApi.getSummary(params),
          dashboardApi.getCategoryBreakdown(params),
          dashboardApi.getRunningBalanceSeries(params),
          dashboardApi.getRecentTransactions({ ...params, limit: 10 }),
        ]);
        if (!cancelled) {
          setSummary(s);
          setCategoryBreakdown(c);
          setRunningBalanceSeries(rb);
          setRecent(r.results);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getAxiosErrorMessage(e));
          setSummary(null);
          setCategoryBreakdown(null);
          setRunningBalanceSeries(null);
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
  }, [user?.id, user?.role, dateFrom, dateTo, tick]);

  const value = useMemo(
    () => ({
      loading,
      error,
      summary,
      categoryBreakdown,
      runningBalanceSeries,
      recent,
      analyticsForbidden,
      dateFrom,
      dateTo,
      setDateFrom,
      setDateTo,
      refetch,
    }),
    [
      loading,
      error,
      summary,
      categoryBreakdown,
      runningBalanceSeries,
      recent,
      analyticsForbidden,
      dateFrom,
      dateTo,
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
