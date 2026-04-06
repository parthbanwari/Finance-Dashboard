import { endOfMonth, startOfMonth, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { formatYmd, parseYmd } from "@/lib/dates";

function presetRangeLastDays(n) {
  const end = new Date();
  const start = subDays(end, n - 1);
  return { from: formatYmd(start), to: formatYmd(end) };
}

function presetThisMonth() {
  const now = new Date();
  return { from: formatYmd(startOfMonth(now)), to: formatYmd(endOfMonth(now)) };
}

export function DashboardFilters() {
  const { dateFrom, dateTo, setDateFrom, setDateTo, loading } = useDashboardData();

  const fromDate = parseYmd(dateFrom);
  const toDate = parseYmd(dateTo);

  const handleFromChange = (next) => {
    setDateFrom(next);
    const t = parseYmd(dateTo);
    const f = parseYmd(next);
    if (f && t && f > t) setDateTo(next);
  };

  const handleToChange = (next) => {
    setDateTo(next);
    const t = parseYmd(next);
    const f = parseYmd(dateFrom);
    if (f && t && t < f) setDateFrom(next);
  };

  const applyPreset = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card/50 p-4 shadow-sm ring-1 ring-primary/5 backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Date range</p>
          <p className="text-xs text-muted-foreground">
            Filter KPIs, charts, and recent activity. Leave empty for no date filter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => {
              const r = presetRangeLastDays(7);
              applyPreset(r.from, r.to);
            }}
            className="shrink-0"
          >
            Last 7 days
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => {
              const r = presetRangeLastDays(30);
              applyPreset(r.from, r.to);
            }}
            className="shrink-0"
          >
            Last 30 days
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => {
              const r = presetThisMonth();
              applyPreset(r.from, r.to);
            }}
            className="shrink-0"
          >
            This month
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => applyPreset("", "")}
            className="shrink-0 text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
        <DatePickerField
          id="dash-from"
          label="From"
          value={dateFrom}
          onChange={handleFromChange}
          disabled={loading}
          maxDate={toDate}
        />
        <DatePickerField
          id="dash-to"
          label="To"
          value={dateTo}
          onChange={handleToChange}
          disabled={loading}
          minDate={fromDate}
        />
      </div>
    </div>
  );
}
