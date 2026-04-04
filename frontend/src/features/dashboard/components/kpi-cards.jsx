import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

import { RupeeIcon } from "@/components/currency/rupee-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

function SkeletonCard() {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-2 pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function KpiCards({
  summary,
  selectedCurrency,
  onSelectCurrency,
  availableCurrencies,
  analyticsForbidden,
  loading,
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (analyticsForbidden || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Total income", icon: ArrowUpRight, positive: true },
          { title: "Total expenses", icon: ArrowDownRight, positive: false },
          { title: "Net balance", icon: Scale, positive: true },
        ].map(({ title, icon: Icon, positive }) => (
          <Card
            key={title}
            className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="font-mono text-2xl tabular-nums text-muted-foreground">
                  —
                </CardTitle>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  positive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Summary totals and charts need Analyst or Admin access. You can still browse
                transactions.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totals = summary.totals_by_currency[selectedCurrency];
  const income = totals?.total_income ?? "0";
  const expenses = totals?.total_expenses ?? "0";
  const net = totals?.net_balance ?? "0";
  const inCurrency = totals?.transaction_count ?? 0;

  const items = [
    {
      title: "Total income",
      value: formatMoney(income),
      hint: `${inCurrency} tx in ${selectedCurrency} · ${summary.transaction_count} total in period`,
      icon: ArrowUpRight,
      positive: true,
    },
    {
      title: "Total expenses",
      value: formatMoney(expenses),
      hint: "Stored as positive magnitudes",
      icon: ArrowDownRight,
      positive: false,
    },
    {
      title: "Net balance",
      value: formatMoney(net),
      hint: "Income minus expenses",
      icon: Scale,
      positive: Number.parseFloat(net) >= 0,
    },
  ];

  return (
    <div className="space-y-3">
      {availableCurrencies.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="kpi-currency" className="text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RupeeIcon className="size-3.5" />
              Totals bucket (ISO)
            </span>
          </Label>
          <select
            id="kpi-currency"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
            value={selectedCurrency}
            onChange={(e) => onSelectCurrency(e.target.value)}
          >
            {availableCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ title, value, hint, positive, icon: Icon }) => (
          <Card
            key={title}
            className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="inline-flex items-center gap-2 font-mono text-2xl tabular-nums text-foreground">
                  <RupeeIcon className="size-7 shrink-0 text-primary" variant="emphasis" />
                  {value}
                </CardTitle>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  positive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
