import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DashboardDataProvider } from "@/contexts/dashboard-data-context";
import { LoginPage } from "@/features/auth/login-page";
import { AnalyticsPage } from "@/features/analytics/analytics-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { TransactionsPage } from "@/features/transactions/transactions-page";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<DashboardDataProvider />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
