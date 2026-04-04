import axios from "axios";

import { apiClient, baseURL } from "@/api/client";
import { unwrapApiResponse } from "@/api/normalize";

/** Passwordless: request a 6-digit code to the email (active user must exist). */
export async function requestOtp(email) {
  const { data } = await axios.post(`${baseURL}/auth/otp/send/`, { email });
  return unwrapApiResponse(data);
}

/** Exchange email + OTP for JWT pair (same as legacy password login). */
export async function verifyOtp(email, otp) {
  const { data } = await axios.post(`${baseURL}/auth/otp/verify/`, { email, otp });
  return unwrapApiResponse(data);
}

/** Optional: username/password (e.g. scripts); primary UI uses OTP. */
export async function login(username, password) {
  const { data } = await axios.post(`${baseURL}/auth/token/`, {
    username,
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
