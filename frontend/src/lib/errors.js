import axios from "axios";

function detailArrayToMessage(detail) {
  if (!Array.isArray(detail)) return null;
  const parts = detail
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        if (typeof x.string === "string") return x.string;
        if (typeof x.detail === "string") return x.detail;
      }
      return null;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function readEnvelopeError(error) {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return null;
  if (Number(data.code) === 0 && typeof data.message === "string" && data.message.trim()) {
    return {
      message: data.message.trim(),
      errorCode: typeof data.error_code === "string" ? data.error_code : null,
    };
  }
  return null;
}

function getAxiosErrorMessageRaw(error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const d = data;
      const detail = d.detail;
      if (typeof detail === "string" && detail.trim()) return detail.trim();
      if (Array.isArray(detail)) {
        const joined = detailArrayToMessage(detail);
        if (joined) return joined;
        return detail
          .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
          .join(" ");
      }
      if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.response?.status === 429) {
      const tooMany = data?.detail;
      if (typeof tooMany === "string" && tooMany.trim()) {
        return tooMany;
      }
      return "Too many requests. Please wait a moment and try again.";
    }
    if (error.response?.status === 401) {
      const detail = data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        return detail.trim();
      }
      const fromArr = detailArrayToMessage(detail);
      if (fromArr) return fromArr;
      if (Number(data?.code) === 0 && typeof data?.message === "string") {
        return data.message.trim();
      }
      return "Session expired. Please sign in again.";
    }
    return error.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

/**
 * Parsed API error for UI (envelope or raw DRF).
 * @returns {{ message: string, errorCode: string | null }}
 */
export function parseAxiosError(error) {
  const env = readEnvelopeError(error);
  if (env) return env;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const detail = data.detail;
      if (typeof detail === "string" && detail.trim()) {
        return { message: detail.trim(), errorCode: null };
      }
      const fromArr = detailArrayToMessage(detail);
      if (fromArr) {
        return { message: fromArr, errorCode: null };
      }
    }
  }

  return { message: getAxiosErrorMessageRaw(error), errorCode: null };
}

export function getAxiosErrorMessage(error) {
  const env = readEnvelopeError(error);
  if (env) return env.message;
  return getAxiosErrorMessageRaw(error);
}
