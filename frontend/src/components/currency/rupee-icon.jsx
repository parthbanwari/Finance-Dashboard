import { IndianRupee } from "lucide-react";

import { cn } from "@/lib/utils";

export function RupeeIcon({ className, variant = "default" }) {
  return (
    <IndianRupee
      className={cn(
        "shrink-0",
        variant === "emphasis" ? "text-primary" : "text-muted-foreground",
        className,
      )}
      aria-hidden
    />
  );
}
