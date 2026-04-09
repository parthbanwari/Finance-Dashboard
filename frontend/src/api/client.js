import axios from "axios";

import { unwrapApiResponse } from "@/api/normalize";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  paramsSerializer: {
    indexes: null,
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshWithFallback(refresh) {
  const paths = ["/auth/token/refresh/", "/token/refresh/"];
  let lastError = null;
  for (const path of paths) {
    try {
      const { data } = await axios.post(`${baseURL}${path}`, { refresh });
      return data;
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError ?? new Error("Unable to reach token refresh endpoint.");
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const data = await refreshWithFallback(refresh);
    const body = unwrapApiResponse(data);
    const access = body.access;
    localStorage.setItem("access_token", access);
    return access;
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.data !== undefined && response.data !== null) {
      response.data = unwrapApiResponse(response.data);
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/token/")
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);

export { baseURL };
