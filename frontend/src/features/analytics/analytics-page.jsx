import { useEffect, useMemo, useState } from "react";

import * as dashboardApi from "@/api/dashboardApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/feedback/api-state";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { CategoryExpensePieChart } from "@/features/dashboard/components/category-expense-pie-chart";
import { MonthlyCashFlowChart } from "@/features/dashboard/components/monthly-cash-flow-chart";
import {
  mapCategoryBreakdownToPieData,
  mapRunningBalanceSeriesToChartData,
} from "@/features/dashboard/lib/map-analytics-charts";
import { getAxiosErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";

const NEEDS_KEYWORDS = [
  "rent", "lease", "maintenance", "society", "housing", "pg", "hostel",

  "grocery", "groceries", "kirana", "ration", "milk", "vegetable", "fruits", "food",

  "electricity", "electric", "power", "water", "gas", "lpg", "utility", "bill",

  "internet", "wifi", "broadband", "mobile", "recharge", "postpaid", "prepaid",

  "transport", "bus", "metro", "auto", "cab", "uber", "ola", "fuel", "petrol", "diesel",

  "medical", "medicine", "doctor", "hospital", "pharmacy", "health", "insurance",

  "school", "college", "tuition", "fees", "education", "books", "exam",

  "emi", "loan", "debt", "credit card bill", "minimum payment", "interest",

  "childcare", "baby", "diaper",

  "tax", "gst", "income tax"
];

const WANTS_KEYWORDS = [

  "dining", "restaurant", "cafe", "coffee", "zomato", "swiggy", "takeout",

  "movie", "cinema", "netflix", "spotify", "prime", "hotstar", "entertainment",

  "shopping", "clothing", "fashion", "amazon", "flipkart", "mall", "luxury",

  "travel", "trip", "vacation", "holiday", "flight", "hotel", "resort",

  "gym", "fitness", "spa", "salon", "beauty",

  "hobby", "gaming", "games", "sports", "music", "art",

  "subscription", "membership",

  "party", "gift", "celebration", "outing"
];

const SAVINGS_KEYWORDS = [
  "saving", "savings", "investment", "invest", "wealth", "portfolio",

  "sip", "mutual fund", "mf", "ppf", "epf", "nps", "fd", "rd",

  "stock", "shares", "equity", "trading", "crypto", "bitcoin",

  "emergency fund", "retirement", "pension",

  "gold", "real estate", "property",

  "transfer to savings", "deposit", "auto invest"
];

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function categoryBucket(name) {
  const lower = String(name || "").toLowerCase();
  if (SAVINGS_KEYWORDS.some((k) => lower.includes(k))) return "savings";
  if (NEEDS_KEYWORDS.some((k) => lower.includes(k))) return "needs";
  if (WANTS_KEYWORDS.some((k) => lower.includes(k))) return "wants";
  return "other";
}

function ruleCheck(summary, categoryBreakdown) {
  const income = toNumber(summary?.totals_by_currency?.INR?.total_income);
  if (!income) {
    return {
      hasEnoughData: false,
      advice: "Add income for this cycle to evaluate the 50/30/20 rule accurately.",
    };
  }
  const byBucket = { needs: 0, wants: 0, savings: 0, other: 0 };
  for (const row of categoryBreakdown?.results ?? []) {
    const spent = toNumber(row.total_expenses);
    if (!spent) continue;
    byBucket[categoryBucket(row.category_name)] += spent;
  }
  const pct = {
    // Percent of income for the selected cycle.
    needs: (byBucket.needs / income) * 100,
    wants: (byBucket.wants / income) * 100,
    savings: (byBucket.savings / income) * 100,
    other: (byBucket.other / income) * 100,
  };

  const alerts = [];
  if (pct.needs > 50) alerts.push("Needs spending is above 50%.");
  if (pct.wants > 30) alerts.push("Wants spending is above 30%.");
  if (pct.savings < 20) alerts.push("Savings allocation is below 20%.");

  return {
    hasEnoughData: true,
    income,
    pct,
    alerts,
    advice:
      alerts.length === 0
        ? "Great job. Your current allocation is close to the 50/30/20 guideline."
        : "Your allocation is outside the 50/30/20 guideline. Rebalance category spending over the next cycle.",
  };
}

function buildBucketDetails(categoryBreakdown) {
  const byBucket = { needs: [], wants: [], savings: [], other: [] };
  for (const row of categoryBreakdown?.results ?? []) {
    const spent = toNumber(row.total_expenses);
    if (!spent) continue;
    const bucket = categoryBucket(row.category_name);
    byBucket[bucket].push({
      categoryName: row.category_name || "Uncategorized",
      spent,
      txCount: row.transaction_count || 0,
    });
  }
  for (const k of Object.keys(byBucket)) {
    byBucket[k].sort((a, b) => b.spent - a.spent);
  }
  return byBucket;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const {
    loading,
    error,
    categoryBreakdown,
    runningBalanceSeries,
    summary,
    analyticsForbidden,
  } = useDashboardData();
  const canEditNote = user?.role === "analyst" || user?.role === "admin";
  const [note, setNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [websiteRecommendation, setWebsiteRecommendation] = useState("");
  const [noteLoading, setNoteLoading] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState(null);

  const donutData = useMemo(
    () => mapCategoryBreakdownToPieData(categoryBreakdown),
    [categoryBreakdown],
  );

  const netLineData = useMemo(
    () => mapRunningBalanceSeriesToChartData(runningBalanceSeries),
    [runningBalanceSeries],
  );
  const rule = useMemo(() => ruleCheck(summary, categoryBreakdown), [summary, categoryBreakdown]);
  const bucketDetails = useMemo(() => buildBucketDetails(categoryBreakdown), [categoryBreakdown]);
  const hasNoteContent = Boolean((note?.note || "").trim());

  useEffect(() => {
    let cancelled = false;
    async function loadNote() {
      setNoteLoading(true);
      setNoteError(null);
      try {
        const data = await dashboardApi.getAnalyticsNote();
        if (cancelled) return;
        setNote(data);
        setNoteText(data?.note ?? "");
        setWebsiteRecommendation(data?.website_recommendation ?? "");
      } catch (e) {
        if (!cancelled) setNoteError(getAxiosErrorMessage(e));
      } finally {
        if (!cancelled) setNoteLoading(false);
      }
    }
    void loadNote();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveNote() {
    setNoteSaving(true);
    setNoteError(null);
    setNoteSaved(false);
    try {
      const updated = await dashboardApi.updateAnalyticsNote({
        note: noteText.trim(),
        website_recommendation: websiteRecommendation.trim(),
      });
      setNote(updated);
      setNoteSaved(true);
    } catch (e) {
      setNoteError(getAxiosErrorMessage(e));
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Analytics</h2>
        <p className="text-muted-foreground">
          Trends and category insights. Includes a 50/30/20 budget check and any analyst guidance shared for your account.
        </p>
      </div>

      <DashboardFilters />

      {error ? <ErrorBlock message={error} /> : null}

      {!error && loading ? <LoadingBlock label="Loading analytics…" /> : null}

      {!error && !loading && analyticsForbidden ? (
        <EmptyBlock
          title="Analytics restricted"
          description="Analyst or Admin access is required to view these reports."
        />
      ) : null}

      {!error && !loading && !analyticsForbidden ? (
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Category expense mix</CardTitle>
                <CardDescription>Share of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                {donutData.length ? (
                  <CategoryExpensePieChart data={donutData} variant="donut" />
                ) : (
                  <EmptyBlock title="No data" description="No expenses in the selected period." />
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Running balance</CardTitle>
                <CardDescription>
                  Cumulative balance after each transaction in the filtered period (chronological order).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {netLineData.length ? (
                  <MonthlyCashFlowChart data={netLineData} />
                ) : (
                  <EmptyBlock title="No data" description="No transactions in range." />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">50/30/20 budget check (BETA)</CardTitle>
              <CardDescription>
                Rule of thumb: 50% Needs, 30% Wants, 20% Savings (calculated for selected date range).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!rule.hasEnoughData ? (
                <p className="text-muted-foreground">{rule.advice}</p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-left hover:bg-muted/40"
                      onClick={() => setSelectedBucket("needs")}
                    >
                      Needs: <strong>{rule.pct.needs.toFixed(2)}%</strong>
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-left hover:bg-muted/40"
                      onClick={() => setSelectedBucket("wants")}
                    >
                      Wants: <strong>{rule.pct.wants.toFixed(2)}%</strong>
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-left hover:bg-muted/40"
                      onClick={() => setSelectedBucket("savings")}
                    >
                      Savings: <strong>{rule.pct.savings.toFixed(2)}%</strong>
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-left hover:bg-muted/40"
                      onClick={() => setSelectedBucket("other")}
                    >
                      Unclassified: <strong>{rule.pct.other.toFixed(2)}%</strong>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Percentages are calculated from income in the selected range. Click a metric to see categories.
                  </p>
                  {rule.alerts.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-amber-700 dark:text-amber-300">
                      {rule.alerts.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-700 dark:text-emerald-300">{rule.advice}</p>
                  )}
                  {rule.alerts.length ? <p className="text-muted-foreground">{rule.advice}</p> : null}
                </>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={Boolean(selectedBucket) && rule.hasEnoughData}
            onOpenChange={(open) => !open && setSelectedBucket(null)}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {(selectedBucket || "Bucket").charAt(0).toUpperCase() + (selectedBucket || "bucket").slice(1)} categories
                </DialogTitle>
                <DialogDescription>
                  Breakdown for the current analytics filters.
                </DialogDescription>
              </DialogHeader>
              {selectedBucket ? (
                bucketDetails[selectedBucket]?.length ? (
                  <div className="max-h-[22rem] space-y-2 overflow-y-auto rounded-md border border-border/70 p-2">
                    {bucketDetails[selectedBucket].map((row) => (
                      <div
                        key={`${selectedBucket}-${row.categoryName}`}
                        className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-foreground">{row.categoryName}</p>
                          <p className="text-xs text-muted-foreground">{row.txCount} transaction(s)</p>
                        </div>
                        <p className="font-mono text-foreground">{formatMoney(row.spent)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No categories matched this bucket in the selected period.
                  </p>
                )
              ) : null}
            </DialogContent>
          </Dialog>

          {(canEditNote || hasNoteContent || noteLoading || noteError) ? (
          <Card className="border-border/80 bg-card/95 shadow-md ring-1 ring-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Analyst note</CardTitle>
              <CardDescription>
                Viewer can read this guidance. Updated by {note?.analyst_name || "—"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {noteError ? <ErrorBlock message={noteError} /> : null}
              {noteLoading ? (
                <p className="text-sm text-muted-foreground">Loading note…</p>
              ) : canEditNote ? (
                <>
                  {!isNoteEditorOpen ? (
                    <div className="space-y-3">
                      {hasNoteContent ? (
                        <p className="text-sm text-muted-foreground">{note.note}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No analyst comment yet.
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNoteEditorOpen(true)}
                      >
                        {hasNoteContent ? "Edit comment" : "Add comment"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="analyst-note">Comment</Label>
                        <textarea
                          id="analyst-note"
                          rows={4}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add user-specific context and next steps."
                        />
                      </div>
                      {noteSaved ? <p className="text-sm text-primary">Saved.</p> : null}
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => void saveNote()} disabled={noteSaving}>
                          {noteSaving ? "Saving…" : "Save note"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsNoteEditorOpen(false)}
                          disabled={noteSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Comment</p>
                    <p className="text-muted-foreground">{note?.note}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          ) : null}

        </div>
      ) : null}
    </div>
  );
}
