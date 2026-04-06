import { format, isValid, parse } from "date-fns";

const YMD = "yyyy-MM-dd";

/**
 * @param {string | undefined | null} s
 * @returns {Date | undefined}
 */
export function parseYmd(s) {
  if (s == null || String(s).trim() === "") return undefined;
  const d = parse(String(s).trim(), YMD, new Date());
  return isValid(d) ? d : undefined;
}

/**
 * @param {Date} d
 * @returns {string}
 */
export function formatYmd(d) {
  return format(d, YMD);
}

/**
 * @param {string | undefined | null} s
 * @returns {string}
 */
export function formatYmdDisplay(s) {
  const d = parseYmd(s);
  return d ? format(d, "d MMM yyyy") : "";
}
