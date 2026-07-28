export type Category = "prata" | "cosmeticos" | string;

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPercent?: number;
  discountPrice?: number;
  category: Category;
  image: string;
  description: string;
  stockQuantity?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  minimumStock?: number;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  inStock?: boolean;
}

export function hasProductShippingDimensions(product: Product): boolean {
  return Number(product.weight ?? 0) > 0
    && Number(product.height ?? 0) > 0
    && Number(product.width ?? 0) > 0
    && Number(product.length ?? 0) > 0;
}

export function availableProductQuantity(product: Product): number {
  const stock = Number(product.stockQuantity ?? 0);
  const reserved = Number(product.reservedQuantity ?? 0);
  return Math.max(0, stock - reserved);
}

export function availableProductQuantityLabel(product: Product): string {
  const quantity = availableProductQuantity(product);
  return quantity === 1 ? "1 unidade disponível" : `${quantity} unidades disponíveis`;
}

export function isProductAvailable(product: Product): boolean {
  return product.inStock !== false && availableProductQuantity(product) > 0;
}
