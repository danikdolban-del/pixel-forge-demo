import type { Lead, Product, ProductInput, LeadStatus } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Не удалось подключиться к серверу. Убедитесь, что приложение запущено.");
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить действие.");
  return data as T;
}

export const api = {
  products: () => request<Product[]>("/api/products"),
  product: (id: string) => request<Product>("/api/products/" + encodeURIComponent(id)),
  sendLead: (payload: { name: string; phone: string; productId: string }) =>
    request<{ message: string }>("/api/leads", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { username: string; password: string }) =>
    request<{ username: string }>("/api/admin/login", { method: "POST", body: JSON.stringify(payload) }),
  session: () => request<{ username: string }>("/api/admin/session"),
  logout: () => request<{ ok: boolean }>("/api/admin/logout", { method: "POST" }),
  adminProducts: () => request<Product[]>("/api/admin/products"),
  saveProduct: (payload: ProductInput, id?: string) =>
    request<Product>(id ? "/api/admin/products/" + encodeURIComponent(id) : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  setPublished: (id: string, published: boolean) =>
    request<{ ok: boolean }>("/api/admin/products/" + encodeURIComponent(id) + "/published", {
      method: "PATCH",
      body: JSON.stringify({ published }),
    }),
  deleteProduct: (id: string) =>
    request<void>("/api/admin/products/" + encodeURIComponent(id), { method: "DELETE" }),
  adminLeads: () => request<Lead[]>("/api/admin/leads"),
  setLeadStatus: (id: string, status: LeadStatus) =>
    request<{ ok: boolean }>("/api/admin/leads/" + encodeURIComponent(id) + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
