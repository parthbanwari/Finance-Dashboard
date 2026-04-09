import { useState } from "react";
import {
  IndianRupee,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { AccountStatusBadge } from "@/components/account-status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAdminTeamOptional } from "@/contexts/admin-team-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const TEAM_PATH = "/settings/team";

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: IndianRupee },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

function navForRole(role) {
  if (role === "admin") {
    const out = [...baseNav];
    const idx = out.findIndex((o) => o.to === "/settings");
    if (idx >= 0) {
      out.splice(idx, 0, { to: TEAM_PATH, label: "Team", icon: Users });
    }
    return out;
  }
  return baseNav;
}

function NavItems({ onNavigate, role, teamInactiveCount = 0 }) {
  const nav = navForRole(role);
  return (
    <nav className="flex flex-col gap-1 p-2">
      {nav.map(({ to, label, icon: Icon }) => {
        const showTeamNotice = to === TEAM_PATH && teamInactiveCount > 0;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/settings"}
            onClick={() => onNavigate?.()}
            aria-label={
              showTeamNotice
                ? `${label}, ${teamInactiveCount} inactive account${teamInactiveCount === 1 ? "" : "s"} need attention`
                : undefined
            }
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0 text-primary/90" aria-hidden />
            <span className="flex-1">{label}</span>
            {showTeamNotice ? (
              <span
                className="size-2 shrink-0 rounded-full bg-amber-500 ring-2 ring-sidebar-border"
                title={`${teamInactiveCount} inactive — open Team → Notifications`}
                aria-hidden
              />
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const teamCtx = useAdminTeamOptional();
  const teamInactiveCount = teamCtx?.inactiveCount ?? 0;
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true, state: {} });
  }

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <IndianRupee className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-foreground">Fincance Tracker</p>
            <p className="truncate text-xs text-muted-foreground" title={user?.email ?? user?.username}>
              {user?.email ?? user?.username ?? "…"}
            </p>
          </div>
        </div>
        <NavItems role={user?.role} teamInactiveCount={teamInactiveCount} />
        <div className="mt-auto space-y-3 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-sidebar-border"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
          <Separator className="bg-sidebar-border" />
        </div>
      </aside>

      <div className="flex h-14 items-center border-b border-border bg-card px-3 sm:px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-[min(100%,20rem)] flex-col bg-sidebar p-0">
            <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <LayoutDashboard className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">Zorvyn Finance</p>
                  <p className="truncate text-xs text-muted-foreground" title={user?.email ?? user?.username}>
                    {user?.email ?? user?.username}
                  </p>
                </div>
              </div>
            </SheetHeader>
            <NavItems
              onNavigate={() => setMobileOpen(false)}
              role={user?.role}
              teamInactiveCount={teamInactiveCount}
            />
            <div className="mt-auto border-t border-sidebar-border p-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-2 flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <IndianRupee className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">Finance Dashboard</span>
          </span>
          {user ? (
            <AccountStatusBadge
              active={user.is_active !== false}
              size="sm"
              className="ml-auto shrink-0"
              aria-label={`Your account is ${user.is_active !== false ? "active" : "inactive"}`}
            />
          ) : null}
        </span>
      </div>
    </>
  );
}
