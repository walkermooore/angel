const API_BASE = "http://localhost:8081/api";

export async function getProductsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/produtos`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function getCategoriesFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/categorias`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}
