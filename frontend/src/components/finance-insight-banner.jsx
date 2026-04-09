import { Lightbulb } from "lucide-react";
import { useMemo } from "react";

import insights from "@/data/financial-insights.json";

const STORAGE_KEY = "finance_dashboard_insight_queue_v1";

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildAllInsights() {
  const mindset = (insights.mindset_lines || []).map((text) => ({
    type: "Mindset",
    text,
  }));
  const rules = (insights.money_rules || []).map((text) => ({
    type: "Rule",
    text,
  }));
  return [...mindset, ...rules];
}

function nextInsight() {
  const all = buildAllInsights();
  if (!all.length) {
    return { type: "Insight", text: "Stay consistent with your financial goals." };
  }

  let queue = [];
  try {
    queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    queue = [];
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    queue = shuffle(all.map((_, idx) => idx));
  }

  const index = queue.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return all[index] || all[0];
}

export function FinanceInsightBanner({ compact = false }) {
  const insight = useMemo(() => nextInsight(), []);

  return (
    <div
      className={
        compact
          ? "inline-flex max-w-[34rem] rounded-md border border-border/70 bg-background/60 px-2.5 py-1.5"
          : "mb-4 rounded-lg border border-border bg-card/70 px-3 py-2.5 sm:mb-6 sm:px-4"
      }
    >
      <div className="flex items-start gap-2.5">
        <div
          className={
            compact
              ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
              : "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
          }
        >
          <Lightbulb className={compact ? "size-3.5" : "size-4"} aria-hidden />
        </div>
        <div className="min-w-0">
          <p
            className={
              compact
                ? "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                : "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            }
          >
            {insight.type} Insight
          </p>
          <p className={compact ? "line-clamp-1 text-xs text-foreground" : "text-sm text-foreground"}>
            {insight.text}
          </p>
        </div>
      </div>
    </div>
  );
}
