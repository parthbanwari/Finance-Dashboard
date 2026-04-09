import { cn } from "@/lib/utils";

/**
 * Visual label for Django `is_active`: inactive users cannot sign in.
 */
export function AccountStatusBadge({
  active,
  className,
  size = "default",
  ...props
}) {
  const isSm = size === "sm";
  return (
    <span
      role="status"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-medium",
        isSm ? "px-2 py-0.5 text-[0.65rem] uppercase tracking-wide" : "px-2.5 py-0.5 text-xs",
        active
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-amber-500/45 bg-amber-500/10 text-amber-900 dark:text-amber-200",
        className,
      )}
      title={
        active
          ? "This account can sign in."
          : "Inactive accounts cannot sign in until an admin reactivates them."
      }
      {...props}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
