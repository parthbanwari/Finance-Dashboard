import { useDashboardData } from "@/contexts/dashboard-data-context";
import { RupeeIcon } from "@/components/currency/rupee-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DashboardFilters() {
  const {
    dateFrom,
    dateTo,
    filterCurrency,
    setDateFrom,
    setDateTo,
    setFilterCurrency,
    loading,
  } = useDashboardData();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="dash-from">From</Label>
          <Input
            id="dash-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dash-to">To</Label>
          <Input
            id="dash-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dash-currency" className="inline-flex items-center gap-1.5">
            <RupeeIcon className="size-3.5" />
            Currency filter
          </Label>
          <Input
            id="dash-currency"
            placeholder="e.g. INR (optional)"
            maxLength={3}
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
