import { cn } from "@/lib/utils";
import { formatSignedTransaction } from "@/lib/format";

import { RupeeIcon } from "./rupee-icon";

export function TransactionAmount({ transaction: t, iconClassName, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <RupeeIcon className={cn("size-3.5", iconClassName)} />
      <span
        className={cn(
          "font-mono tabular-nums",
          t.type === "income" ? "text-primary" : "text-destructive",
        )}
      >
        {formatSignedTransaction(t)}
      </span>
    </span>
  );
}
