import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/contexts/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
