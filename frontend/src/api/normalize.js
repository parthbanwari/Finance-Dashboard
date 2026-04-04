/**
 * Unwrap API bodies after axios:
 * - { success: true, data } (legacy)
 * - { code: 1, message, data } (current backend envelope)
 * - raw DRF / JSON (pass through)
 *
 * Unwraps recursively in case the payload is double-wrapped.
 */
export function unwrapApiResponse(raw, depth = 0) {
  if (depth > 8 || !raw || typeof raw !== "object") {
    return raw;
  }
  const o = raw;

  if (o.success === true && "data" in o) {
    return unwrapApiResponse(o.data, depth + 1);
  }

  if (Number(o.code) === 1 && "data" in o) {
    return unwrapApiResponse(o.data, depth + 1);
  }

  return raw;
}
