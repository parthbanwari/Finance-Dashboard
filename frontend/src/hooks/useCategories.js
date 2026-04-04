import { useCallback, useEffect, useState } from "react";

import * as transactionApi from "@/api/transactionApi";
import { getAxiosErrorMessage } from "@/lib/errors";

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await transactionApi.listAllCategories();
      setCategories(list);
    } catch (e) {
      setError(getAxiosErrorMessage(e));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { categories, loading, error, refetch };
}
