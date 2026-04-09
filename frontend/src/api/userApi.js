import axios from "axios";

import { apiClient, baseURL } from "@/api/client";
import { unwrapApiResponse } from "@/api/normalize";

async function postWithFallback(paths, body) {
  let lastError = null;
  for (const path of paths) {
    try {
      const { data } = await axios.post(`${baseURL}${path}`, body);
      return data;
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError ?? new Error("Unable to reach authentication endpoint.");
}

/** Sign in with email + shared DEMO_LOGIN_PASSWORD (configured on server). */
export async function login(email, password, role) {
  const data = await postWithFallback(["/auth/token/", "/token/"], {
    email,
    password,
    ...(role ? { role } : {}),
  });
  return unwrapApiResponse(data);
}

export async function getMe() {
  const { data } = await apiClient.get("/users/me/");
  return data;
}

export async function patchMe(body) {
  const { data } = await apiClient.patch("/users/me/", body);
  return data;
}

/** Admin only — paginated list. */
export async function listUsers(params = {}) {
  const { data } = await apiClient.get("/users/", {
    params: { page_size: 100, ...params },
  });
  return data;
}

/** Admin only — update role, active flag, etc. */
export async function patchUser(userId, body) {
  const { data } = await apiClient.patch(`/users/${userId}/`, body);
  return data;
}
