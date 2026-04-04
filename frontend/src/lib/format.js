/** All amounts are shown in Indian Rupees (₹) in the UI. */
export const APP_CURRENCY = "INR";

/** Digits only (en-IN grouping). Pair with `RupeeIcon` in components to avoid duplicate ₹. */
export function formatMoney(amount) {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Tremor charts (string-only tooltips; uses ₹ via Intl — icons are not available in chart labels). */
export function formatRupeesCompact(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: APP_CURRENCY,
    maximumFractionDigits: value >= 100000 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatSignedTransaction(t) {
  const sign = t.type === "income" ? "+" : "−";
  return `${sign}${formatMoney(t.amount)}`;
}

export function formatShortMonthLabel(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(d);
}
