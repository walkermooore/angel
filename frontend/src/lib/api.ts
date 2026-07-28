const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
export const API_BASE = configuredApiUrl.replace(/\/+$/, "");

function authorizationHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const csrfToken = localStorage.getItem("angel:csrf_token");
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}

// Helper fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authorizationHeader(),
        ...(options?.headers || {}),
      },
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

async function apiMutation<T>(endpoint: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authorizationHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || `A API respondeu com o status ${res.status}.`);
  }

  if (res.status === 204) return true as T;
  return res.json() as Promise<T>;
}

// Products
function productMutationPayload(data: any) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    discountPercent: data.discountPercent,
    discountPrice: data.discountPrice,
    category: data.category,
    image: data.image,
    highlighted: data.highlighted,
    stockQuantity: data.stockQuantity,
    minimumStock: data.minimumStock,
    weight: data.weight,
    height: data.height,
    width: data.width,
    length: data.length,
  };
}

export const getProductsFromBackend = () => apiFetch<any[]>("/produtos");
export const getProductFromBackend = (id: string) => apiFetch<any>(`/produtos/${encodeURIComponent(id)}`);
export const createProductInBackend = (data: any) =>
  apiMutation<any>("/produtos", { method: "POST", body: JSON.stringify(productMutationPayload(data)) });
export const updateProductInBackend = (id: string, data: any) =>
  apiMutation<any>(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(productMutationPayload(data)) });
export const deleteProductFromBackend = (id: string) =>
  apiMutation<boolean>(`/produtos/${id}`, { method: "DELETE" });

// Categories
export const getCategoriesFromBackend = () => apiFetch<any[]>("/categorias");
export const createCategoryInBackend = (name: string) => apiFetch("/categorias", { method: "POST", body: JSON.stringify({ name }) });
export const deleteCategoryFromBackend = (name: string) => apiFetch(`/categorias/${name}`, { method: "DELETE" });

// Highlights
export const getHighlightsFromBackend = () => apiFetch<any[]>("/destaques");
export const saveHighlightsToBackend = (ids: string[]) => apiFetch("/destaques", { method: "POST", body: JSON.stringify(ids) });

// Admin Auth
export const loginAdminBackend = (email: string, pass: string) =>
  apiMutation<{ success: boolean; csrfToken?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: pass }),
  });
export const logoutAdminBackend = () =>
  apiMutation<{ success: boolean }>("/auth/logout", { method: "POST" });

// Orders
export const getOrdersFromBackend = () => apiFetch<any[]>("/pedidos");
export const createOrderInBackend = (orderData: any, idempotencyKey: string) =>
  apiMutation<any>("/pedidos", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(orderData),
  });
export const getOrderFromBackend = (idOrNumber: string) => apiFetch<any>(`/pedidos/${idOrNumber}`);
export const trackOrderFromBackend = (number: string, contact: string, trackingToken?: string) =>
  apiMutation<any>("/pedidos/acompanhar", {
    method: "POST",
    body: JSON.stringify({ number, contact, trackingToken }),
  });
export const updateOrderStatusInBackend = (id: string, status: string) =>
  apiMutation<any>(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const updateOrderTrackingInBackend = (id: string, trackingCode: string) =>
  apiMutation<any>(`/pedidos/${id}/tracking-code`, { method: "PATCH", body: JSON.stringify({ trackingCode }) });
export const getMelhorEnvioAuthorizationUrl = () =>
  apiMutation<{ url: string }>("/frete/oauth/authorization-url", { method: "GET" });

// Audit Logs
export const getAuditLogsFromBackend = () => apiFetch<any[]>("/auditoria");
export const createAuditLogBackend = (orderNumber: string, action: string, user: string, details: string) =>
  apiFetch("/auditoria", { method: "POST", body: JSON.stringify({ orderNumber, action, user, details }) });

// FAQs
export const getFaqsFromBackend = () => apiFetch<any[]>("/faq");
export const createFaqInBackend = (faq: any) => apiFetch("/faq", { method: "POST", body: JSON.stringify(faq) });
export const updateFaqInBackend = (id: string, faq: any) => apiFetch(`/faq/${id}`, { method: "PUT", body: JSON.stringify(faq) });
export const deleteFaqFromBackend = (id: string) => apiFetch(`/faq/${id}`, { method: "DELETE" });

// Home Settings
export const getHomeSettingsFromBackend = () => apiFetch<any>("/home-settings");
export const saveHomeSettingsToBackend = (settings: any) => apiFetch("/home-settings", { method: "PUT", body: JSON.stringify(settings) });

// Sobre Nós Settings
export const getAboutSettingsFromBackend = () => apiFetch<any>("/sobre-nos");
export const saveAboutSettingsToBackend = (settings: any) => apiFetch("/sobre-nos", { method: "PUT", body: JSON.stringify(settings) });

// Institutional pages
export const getInstitutionalSettingsFromBackend = () => apiFetch<any>("/paginas-institucionais");
export const saveInstitutionalSettingsToBackend = (settings: any) =>
  apiMutation<any>("/paginas-institucionais", { method: "PUT", body: JSON.stringify(settings) });
