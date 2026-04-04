import { apiClient } from "@/api/client";

export async function listTransactions(params) {
  const { data } = await apiClient.get("/transactions/", {
    params,
  });
  return data;
}

export async function getTransaction(id) {
  const { data } = await apiClient.get(`/transactions/${id}/`);
  return data;
}

export async function createTransaction(payload) {
  const { data } = await apiClient.post("/transactions/", payload);
  return data;
}

export async function updateTransaction(id, payload) {
  const { data } = await apiClient.put(`/transactions/${id}/`, payload);
  return data;
}

export async function patchTransaction(id, payload) {
  const { data } = await apiClient.patch(`/transactions/${id}/`, payload);
  return data;
}

export async function deleteTransaction(id) {
  await apiClient.delete(`/transactions/${id}/`);
}

/** Analyst/Admin: create a category (name unique per user). */
export async function createCategory(payload) {
  const { data } = await apiClient.post("/transactions/categories/", payload);
  return data;
}

/** Paginated; callers may request page_size up to 100 (backend max). */
export async function listCategoriesPage(page = 1, pageSize = 100) {
  const { data } = await apiClient.get("/transactions/categories/", {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function listAllCategories() {
  const first = await listCategoriesPage(1, 100);
  if (!first) return [];

  // Paginated DRF: { count, next, previous, results }. Defensive if shape differs.
  const firstResults = Array.isArray(first.results) ? first.results : Array.isArray(first) ? first : [];
  const out = [...firstResults];
  const total = typeof first.count === "number" ? first.count : out.length;
  let page = 2;
  while (out.length < total) {
    const next = await listCategoriesPage(page, 100);
    const chunk = next?.results;
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    out.push(...chunk);
    page += 1;
  }
  return out;
}
