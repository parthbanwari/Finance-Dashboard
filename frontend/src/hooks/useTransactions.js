import { useCallback, useEffect, useState } from "react";

import * as transactionApi from "@/api/transactionApi";
import { getAxiosErrorMessage } from "@/lib/errors";

const defaultFilters = {
  dateFrom: "",
  dateTo: "",
  categoryId: "",
  type: "",
};

export function useTransactions(initialPage = 1, pageSize = 25) {
  const [page, setPage] = useState(initialPage);
  const [filters, setFiltersInternal] = useState(defaultFilters);

  const setFilters = useCallback((next) => {
    setFiltersInternal((prev) =>
      typeof next === "function" ? next(prev) : { ...prev, ...next },
    );
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersInternal(defaultFilters);
    setPage(1);
  }, []);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildParams = useCallback(() => {
    const p = {
      page,
      page_size: pageSize,
      ordering: "-transaction_date",
    };
    if (filters.dateFrom) p.date_from = filters.dateFrom;
    if (filters.dateTo) p.date_to = filters.dateTo;
    if (filters.categoryId?.trim()) {
      p.category = filters.categoryId.trim();
    }
    if (filters.type === "income" || filters.type === "expense") {
      p.type = filters.type;
    }
    return p;
  }, [page, pageSize, filters]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionApi.listTransactions(buildParams());
      setData(res);
    } catch (e) {
      setError(getAxiosErrorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    page,
    setPage,
    filters,
    setFilters,
    clearFilters,
    refetch,
  };
}
