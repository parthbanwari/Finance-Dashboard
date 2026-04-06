/** Indian Rupees (INR) only — no other currencies in this app. */
export const APP_CURRENCY = "INR";

/** Digits only (en-IN grouping). Pair with `RupeeIcon` for ₹ in the UI. */
export function formatMoney(amount) {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Charts / tooltips: "Rs" + compact number (no $ or foreign symbols). */
export function formatRupeesCompact(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: Math.abs(n) >= 100000 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(n);
  /* Non-breaking space keeps "Rs" + amount on one line in charts and tight UI. */
  return `Rs\u00A0${formatted}`;
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
