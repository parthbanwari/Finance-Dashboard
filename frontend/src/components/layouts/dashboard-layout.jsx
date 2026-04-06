import { Outlet, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/layouts/app-sidebar";

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
  const headerTitle = HEADER_TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="hidden h-14 shrink-0 items-center border-b border-border bg-card/80 px-6 backdrop-blur md:flex">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {headerTitle}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
