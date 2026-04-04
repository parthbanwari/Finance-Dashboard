import axios from "axios";

export function getAxiosErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const d = data;
      if (typeof d.message === "string" && d.code === 0) {
        return d.message;
      }
      const detail = d.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
          .join(" ");
      }
      if (typeof d.message === "string") return d.message;
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
        return detail;
      }
      return "Session expired. Please sign in again.";
    }
    return error.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
