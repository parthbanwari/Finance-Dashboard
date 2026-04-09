import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as userApi from "@/api/userApi";
import { useAuth } from "@/contexts/auth-context";
import { getAxiosErrorMessage } from "@/lib/errors";

const AdminTeamContext = createContext(null);

export function AdminTeamProvider({ children }) {
  const { user } = useAuth();
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const refreshTeamUsers = useCallback(async () => {
    if (user?.role !== "admin") {
      setTeamUsers([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const raw = await userApi.listUsers();
      const list = Array.isArray(raw) ? raw : raw?.results ?? [];
      setTeamUsers(list);
    } catch (e) {
      setTeamUsers([]);
      setLoadError(getAxiosErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void refreshTeamUsers();
  }, [refreshTeamUsers]);

  const inactiveCount = useMemo(
    () => teamUsers.filter((u) => u.is_active === false).length,
    [teamUsers],
  );

  const mergeTeamUser = useCallback((userId, partial) => {
    setTeamUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...partial } : u)));
  }, []);

  const value = useMemo(
    () => ({
      teamUsers,
      teamUsersLoading: loading,
      teamLoadError: loadError,
      inactiveCount,
      refreshTeamUsers,
      mergeTeamUser,
    }),
    [teamUsers, loading, loadError, inactiveCount, refreshTeamUsers, mergeTeamUser],
  );

  return <AdminTeamContext.Provider value={value}>{children}</AdminTeamContext.Provider>;
}

export function useAdminTeam() {
  const ctx = useContext(AdminTeamContext);
  if (!ctx) {
    throw new Error("useAdminTeam must be used within AdminTeamProvider");
  }
  return ctx;
}

/** Sidebar runs outside provider in tests or edge layouts — return safe defaults. */
export function useAdminTeamOptional() {
  return useContext(AdminTeamContext);
}
