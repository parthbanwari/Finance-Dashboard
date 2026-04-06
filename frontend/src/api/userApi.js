import axios from "axios";

import { apiClient, baseURL } from "@/api/client";
import { unwrapApiResponse } from "@/api/normalize";

/** Sign in with email + shared DEMO_LOGIN_PASSWORD (configured on server). */
export async function login(email, password) {
  const { data } = await axios.post(`${baseURL}/auth/token/`, {
    email,
    password,
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
