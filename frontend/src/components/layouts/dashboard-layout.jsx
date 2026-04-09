import { Outlet, useLocation } from "react-router-dom";

import { AccountStatusBadge } from "@/components/account-status-badge";
import { FinanceInsightBanner } from "@/components/finance-insight-banner";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AdminTeamProvider } from "@/contexts/admin-team-context";
import { useAuth } from "@/contexts/auth-context";

const HEADER_TITLES = {
  "/dashboard": "Overview",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/settings/team": "Team",
};

/**
 * Shell: persistent sidebar + scrollable main. Feature routes render inside <Outlet />.
 */
export function DashboardLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const headerTitle = HEADER_TITLES[pathname] ?? "Dashboard";
  const accountActive = user?.is_active !== false;

  return (
    <AdminTeamProvider>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AppSidebar />
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="relative hidden h-14 shrink-0 items-center border-b border-border bg-card/80 px-6 backdrop-blur md:flex">
            <h1 className="z-10 shrink-0 text-lg font-semibold tracking-tight text-foreground">
              {headerTitle}
            </h1>
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <FinanceInsightBanner compact />
            </div>
            {user ? (
              <AccountStatusBadge
                active={accountActive}
                className="z-10 ml-auto"
                aria-label={`Your account is ${accountActive ? "active" : "inactive"}`}
              />
            ) : null}
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminTeamProvider>
  );
}
