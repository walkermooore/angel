export const API_BASE = "http://localhost:8081/api";

// Helper fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (res.ok) {
      if (res.status === 240 || res.status === 204) return true as unknown as T;
      return await res.json();
    }
  } catch (err) {
    // API server unreachable fallback
  }
  return null;
}

// Products
export const getProductsFromBackend = () => apiFetch<any[]>("/produtos");
export const createProductInBackend = (data: any) => apiFetch("/produtos", { method: "POST", body: JSON.stringify(data) });
export const updateProductInBackend = (id: string, data: any) => apiFetch(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProductFromBackend = (id: string) => apiFetch(`/produtos/${id}`, { method: "DELETE" });

// Categories
export const getCategoriesFromBackend = () => apiFetch<any[]>("/categorias");
export const createCategoryInBackend = (name: string) => apiFetch("/categorias", { method: "POST", body: JSON.stringify({ name }) });
export const deleteCategoryFromBackend = (name: string) => apiFetch(`/categorias/${name}`, { method: "DELETE" });

// Highlights
export const getHighlightsFromBackend = () => apiFetch<any[]>("/destaques");
export const saveHighlightsToBackend = (ids: string[]) => apiFetch("/destaques", { method: "POST", body: JSON.stringify(ids) });

// Admin Auth
export const loginAdminBackend = (email: string, pass: string) =>
  apiFetch<{ success: boolean; token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: pass }),
  });

// Orders
export const getOrdersFromBackend = () => apiFetch<any[]>("/pedidos");
export const createOrderInBackend = (orderData: any) => apiFetch("/pedidos", { method: "POST", body: JSON.stringify(orderData) });
export const getOrderFromBackend = (idOrNumber: string) => apiFetch<any>(`/pedidos/${idOrNumber}`);
export const updateOrderStatusInBackend = (id: string, status: string) =>
  apiFetch(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const updateOrderTrackingInBackend = (id: string, trackingCode: string) =>
  apiFetch(`/pedidos/${id}/tracking-code`, { method: "PATCH", body: JSON.stringify({ trackingCode }) });

// Audit Logs
export const getAuditLogsFromBackend = () => apiFetch<any[]>("/auditoria");
export const createAuditLogBackend = (orderNumber: string, action: string, user: string, details: String) =>
  apiFetch("/auditoria", { method: "POST", body: JSON.stringify({ orderNumber, action, user, details }) });

// FAQs
export const getFaqsFromBackend = () => apiFetch<any[]>("/faq");
export const createFaqInBackend = (faq: any) => apiFetch("/faq", { method: "POST", body: JSON.stringify(faq) });
export const updateFaqInBackend = (id: string, faq: any) => apiFetch(`/faq/${id}`, { method: "PUT", body: JSON.stringify(faq) });
export const deleteFaqFromBackend = (id: string) => apiFetch(`/faq/${id}`, { method: "DELETE" });

// Home Settings
export const getHomeSettingsFromBackend = () => apiFetch<any>("/home-settings");
export const saveHomeSettingsToBackend = (settings: any) => apiFetch("/home-settings", { method: "PUT", body: JSON.stringify(settings) });
