/**
 * Explicit hex colors for Tremor charts — avoids missing Tailwind `*-emerald-500` / SVG
 * `currentColor` issues that render black on dark backgrounds.
 * Aligned with Deep Navy + Emerald (`globals.css` primary ~160°) and soft rose outflow.
 */

/** Monthly area: income (teal-emerald) vs expense (rose) */
export const AREA_INCOME_EXPENSE_HEX = ["#2dd4bf", "#f472b6"];

/** Category pie: distinct, cool spectrum that reads on hsl(222 47% 6%) */
export const CATEGORY_PIE_HEX = [
  "#34d399",
  "#14b8a6",
  "#22d3ee",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#94a3b8",
];

/**
 * Classes Tremor generates for arbitrary hex (must be safelisted — see `tailwind.config.js`).
 * @returns {string[]}
 */
export function tremorHexSafelist() {
  const hexes = [...new Set([...AREA_INCOME_EXPENSE_HEX, ...CATEGORY_PIE_HEX])];
  const roles = ["fill", "stroke", "text", "bg"];
  const out = [];
  for (const hex of hexes) {
    for (const role of roles) {
      out.push(`${role}-[${hex}]`, `dark:${role}-[${hex}]`);
    }
  }
  return out;
}
