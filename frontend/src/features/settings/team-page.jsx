import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users } from "lucide-react";

import * as userApi from "@/api/userApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBlock } from "@/components/feedback/api-state";
import { useAuth } from "@/contexts/auth-context";
import { getAxiosErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "analyst", label: "Analyst" },
  { value: "admin", label: "Admin" },
];

export function TeamPage() {
  const { user, refreshUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const raw = await userApi.listUsers();
      const list = Array.isArray(raw) ? raw : raw?.results ?? [];
      setRows(list);
    } catch (e) {
      setError(getAxiosErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRoleChange(target, nextRole) {
    if (!target?.id || target.role === nextRole) return;
    setSavingId(target.id);
    setError(null);
    try {
      await userApi.patchUser(target.id, { role: nextRole });
      setRows((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, role: nextRole } : u)),
      );
      await refreshUser();
    } catch (e) {
      setError(getAxiosErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Team</h2>
        <p className="text-muted-foreground">
          Assign <strong>Viewer</strong> (read-only) or <strong>Analyst</strong> (can add and edit
          data). <strong>Admin</strong> can manage users and delete records.
        </p>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      <Card>
        <CardHeader className="flex flex-col items-start gap-3 space-y-0 sm:flex-row">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>
              Users must exist in the database.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void load()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="w-[10rem] px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr
                      key={u.id}
                      className={cn(
                        "border-b border-border/80 last:border-0",
                        (u.id === user?.id || savingId === u.id) && "bg-muted/20",
                      )}
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {u.email || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{u.username}</td>
                      <td className="px-3 py-2">
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={u.role}
                          disabled={savingId === u.id}
                          onChange={(e) => onRoleChange(u, e.target.value)}
                          aria-label={`Role for ${u.email || u.username}`}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
