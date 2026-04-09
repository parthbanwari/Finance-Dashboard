import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, Users } from "lucide-react";

import * as userApi from "@/api/userApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccountStatusBadge } from "@/components/account-status-badge";
import { ErrorBlock } from "@/components/feedback/api-state";
import { useAdminTeam } from "@/contexts/admin-team-context";
import { useAuth } from "@/contexts/auth-context";
import { getAxiosErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { value: "viewer", label: "Viewer" },
  { value: "analyst", label: "Analyst" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function formatLastActivity(iso) {
  if (!iso) return "Never signed in";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function TeamPage() {
  const { user, refreshUser } = useAuth();
  const {
    teamUsers: rows,
    teamUsersLoading: loading,
    teamLoadError,
    inactiveCount,
    refreshTeamUsers,
    mergeTeamUser,
  } = useAdminTeam();
  const [mutationError, setMutationError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [tab, setTab] = useState("users");

  async function load() {
    setMutationError(null);
    await refreshTeamUsers();
  }

  const displayError = teamLoadError || mutationError;

  async function onRoleChange(target, nextRole) {
    if (!target?.id || target.role === nextRole) return;
    setSavingId(target.id);
    setMutationError(null);
    try {
      const updated = await userApi.patchUser(target.id, { role: nextRole });
      mergeTeamUser(target.id, updated);
      await refreshUser();
    } catch (e) {
      setMutationError(getAxiosErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  async function onStatusChange(target, nextActive) {
    if (!target?.id || Boolean(target.is_active) === nextActive) return;
    setSavingId(target.id);
    setMutationError(null);
    try {
      const updated = await userApi.patchUser(target.id, { is_active: nextActive });
      mergeTeamUser(target.id, updated);
      await refreshUser();
    } catch (e) {
      setMutationError(getAxiosErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const inactiveRows = rows.filter((u) => u.is_active === false);
  const hasNotices = inactiveCount > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Team</h2>
        <p className="text-muted-foreground">
          Assign <strong>Viewer</strong> (read-only) or <strong>Analyst</strong> (can add and edit
          data). <strong>Admin</strong> can manage users and delete records. Set{" "}
          <strong>Inactive</strong> to block sign-in without removing the account (you cannot
          deactivate yourself).
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Team sections"
      >
        <Button
          type="button"
          size="sm"
          variant={tab === "users" ? "default" : "outline"}
          className="gap-2"
          onClick={() => setTab("users")}
          role="tab"
          aria-selected={tab === "users"}
        >
          <Users className="size-4" aria-hidden />
          Users
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "notifications" ? "default" : "outline"}
          className="relative gap-2"
          onClick={() => setTab("notifications")}
          role="tab"
          aria-selected={tab === "notifications"}
        >
          {hasNotices ? (
            <span
              className="absolute left-1.5 top-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-background"
              aria-hidden
            />
          ) : null}
          <Bell className="size-4" aria-hidden />
          <span className={hasNotices ? "pl-0.5" : undefined}>Notifications</span>
          {inactiveRows.length > 0 ? (
            <span className="rounded-full bg-background/80 px-1.5 py-0 text-[0.65rem] font-semibold text-foreground">
              {inactiveRows.length}
            </span>
          ) : null}
        </Button>
      </div>

      {displayError ? <ErrorBlock message={displayError} /> : null}

      {tab === "users" ? (
        <Card>
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 sm:flex-row">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>
                Status controls whether someone can sign in. Role controls what they can do in the app.
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
                <table className="w-full min-w-[52rem] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Username</th>
                      <th className="w-[7.5rem] px-3 py-2">Status</th>
                      <th className="w-[10rem] px-3 py-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => {
                      const isNoticeUser = u.is_active === false;
                      return (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-b border-border/80 last:border-0",
                          isNoticeUser &&
                            "border-l-[3px] border-l-amber-500 bg-amber-500/[0.06] dark:bg-amber-500/10",
                          (u.id === user?.id || savingId === u.id) &&
                            (isNoticeUser
                              ? "ring-1 ring-inset ring-amber-500/35"
                              : "bg-muted/20"),
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              {isNoticeUser ? (
                                <span
                                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300"
                                  title="Listed under Notifications — cannot sign in until reactivated"
                                >
                                  <Bell className="size-3.5" aria-hidden />
                                </span>
                              ) : null}
                              <span>{u.email || "—"}</span>
                            </div>
                            {isNoticeUser ? (
                              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                Needs sign-in access · shows in Notifications
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{u.username}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                            <AccountStatusBadge
                              active={u.is_active !== false}
                              size="sm"
                              className="hidden sm:inline-flex"
                            />
                            <select
                              className="h-9 w-full min-w-[7rem] rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[9rem]"
                              value={u.is_active === false ? "false" : "true"}
                              disabled={savingId === u.id || u.id === user?.id}
                              title={
                                u.id === user?.id
                                  ? "You cannot change your own active status here."
                                  : undefined
                              }
                              onChange={(e) => onStatusChange(u, e.target.value === "true")}
                              aria-label={`Account status for ${u.email || u.username}`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
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
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 sm:flex-row">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Bell className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Account notices</CardTitle>
              <CardDescription>
                Inactive users cannot sign in. Reactivate them in the Users tab.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void load()}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : inactiveRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No inactive accounts. Nothing needs your attention here.
              </p>
            ) : (
              <ul className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                {inactiveRows.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-1.5 border-b border-border/60 border-l-[3px] border-l-amber-500 bg-amber-500/[0.05] py-2 pl-3 pr-2 text-sm last:border-b-0 last:pb-0 dark:bg-amber-500/10"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500/25 text-amber-900 dark:text-amber-200">
                        <Bell className="size-3.5" aria-hidden />
                      </span>
                      <span className="font-medium text-foreground">{u.email || u.username}</span>
                      <AccountStatusBadge active={false} size="sm" />
                      <span className="text-xs text-muted-foreground">· {u.role}</span>
                    </div>
                    <p className="pl-8 text-xs text-muted-foreground">
                      Inactive account (blocked at sign-in). Last activity:{" "}
                      {formatLastActivity(u.last_login)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
