import type { Product } from "./products";
import { normalizeCategory } from "./products";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export interface BackendProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  discountPercent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function mapBackendToFrontend(p: BackendProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: Number(p.price),
    category: normalizeCategory(p.category ?? "prata"),
    image: p.imageUrl ?? "",
    discountPercent: Number.isFinite(Number(p.discountPercent)) ? Number(p.discountPercent) : 0,
  };
}

export function mapFrontendToBackend(p: Omit<Product, "id"> | Product) {
  return {
    name: p.name,
    description: p.description,
    price: p.price,
    category: normalizeCategory(p.category),
    imageUrl: p.image,
    discountPercent: p.discountPercent ?? 0,
  };
}

export async function fetchProductsApi(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/produtos`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Erro na API (${response.status}): ${response.statusText}`);
  }
  const data: BackendProduct[] = await response.json();
  return data.map(mapBackendToFrontend);
}

export async function createProductApi(p: Omit<Product, "id">): Promise<Product> {
  const body = mapFrontendToBackend(p);
  const response = await fetch(`${API_BASE}/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Erro ao criar produto (${response.status})`);
  }
  const created: BackendProduct = await response.json();
  return mapBackendToFrontend(created);
}

export async function updateProductApi(id: string, p: Partial<Product> & { name: string; description: string; price: number; category: string; image: string }): Promise<Product> {
  const body = mapFrontendToBackend(p);
  const response = await fetch(`${API_BASE}/produtos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Erro ao atualizar produto (${response.status})`);
  }
  const updated: BackendProduct = await response.json();
  return mapBackendToFrontend(updated);
}

export async function deleteProductApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/produtos/${id}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Erro ao remover produto (${response.status})`);
  }
}
