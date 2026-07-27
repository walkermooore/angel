import type { Product } from "./products";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://angell.com.br").replace(/\/+$/, "");

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productSlug(product: Pick<Product, "id" | "name">): string {
  return `${slugify(product.name)}--${product.id}`;
}

export function productUrl(product: Pick<Product, "id" | "name">): string {
  return `${SITE_URL}/produtos/${productSlug(product)}`;
}
