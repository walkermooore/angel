import { useSyncExternalStore } from "react";
import { products as seedProducts, type Product } from "./products";
import { auditApi } from "./auditStore";
import {
  getProductsFromBackend,
  createProductInBackend,
  updateProductInBackend,
  deleteProductFromBackend,
  getOrdersFromBackend,
  createOrderInBackend,
  updateOrderStatusInBackend,
  updateOrderTrackingInBackend,
} from "./api";

export type OrderStatus = "Pendente" | "Pago" | "Enviado" | "Pronto para Retirada" | "Concluído";
export type ShippingOption = "entrega" | "retirada";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  number: string;
  email: string;
  customerName?: string;
  phone?: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingOption?: ShippingOption;
  trackingCode?: string;
  publicTrackingToken?: string;
  payment: "PIX" | "Cartão" | "Boleto";
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

export interface CreateOrderInput {
  customerName: string;
  email: string;
  phone: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingOption: ShippingOption;
  shippingQuoteId: `ME-${number}` | "PICKUP";
  payment: "PIX" | "CARTAO" | "BOLETO";
  address: Order["address"];
}

const PRODUCTS_KEY = "angel:products";
const ORDERS_KEY = "angel:orders";

const developmentSeedOrders: Order[] = [
  {
    id: "ord-1",
    number: "ANG-20260723-9482",
    email: "contato@example.invalid",
    createdAt: new Date().toISOString(),
    items: [
      { productId: "1", name: "Colar Éclat Prata 925", price: 170.1, quantity: 1, image: seedProducts[0]?.image || "" },
      { productId: "4", name: "Sérum Radiance Angell", price: 179, quantity: 1, image: seedProducts[3]?.image || "" },
    ],
    subtotal: 349.1,
    shipping: 0,
    total: 349.1,
    status: "Pago",
    shippingOption: "retirada",
    trackingCode: "",
    payment: "PIX",
    address: {
      cep: "78000-000",
      street: "Retirada na loja física",
      number: "500",
      neighborhood: "Centro",
      city: "Cuiabá",
      state: "MT",
    },
  },
];
const seedOrders: Order[] = import.meta.env.PROD ? [] : developmentSeedOrders;

function loadProducts(): Product[] {
  if (typeof window === "undefined") return seedProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedProducts;
}

function loadOrders(): Order[] {
  if (typeof window === "undefined") return seedOrders;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return seedOrders;
}

type Listener = () => void;
function createStore<T>(key: string, initial: () => T) {
  let state = initial();
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      emit();
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const productStore = createStore<Product[]>(PRODUCTS_KEY, loadProducts);
export const orderStore = createStore<Order[]>(ORDERS_KEY, loadOrders);

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const value =
    typeof status === "object" && status !== null && "description" in status
      ? String((status as { description: unknown }).description)
      : String(status || "");
  const normalized = value.trim().toLowerCase().replaceAll("_", " ");

  if (normalized.includes("pronto") || normalized.includes("retirada")) return "Pronto para Retirada";
  if (normalized.includes("pago")) return "Pago";
  if (normalized.includes("envi")) return "Enviado";
  if (normalized.includes("concl")) return "Concluído";
  return "Pendente";
}

export function mapOrderFromBackend(o: any): Order {
  const allProds = productStore.get();
  return {
    id: String(o.id),
    number: o.number || "ANG-1001",
    email: o.email || "",
    customerName: o.customerName || "",
    phone: o.phone || "",
    createdAt: o.createdAt || new Date().toISOString(),
    items: (o.items || []).map((i: any) => {
      const matchedProd = allProds.find((p) => String(p.id) === String(i.productId));
      return {
        productId: String(i.productId || ""),
        name: i.name || matchedProd?.name || "",
        price: Number(i.price || matchedProd?.price || 0),
        quantity: Number(i.quantity || 1),
        image: i.image || matchedProd?.image || seedProducts[0]?.image || "",
      };
    }),
    subtotal: Number(o.subtotal || o.total || 0),
    shipping: Number(o.shipping || 0),
    total: Number(o.total || 0),
    status: normalizeOrderStatus(o.status),
    shippingOption: (o.shippingOption as ShippingOption) || "entrega",
    trackingCode: o.trackingCode || "",
    publicTrackingToken: o.publicTrackingToken || "",
    payment: o.payment === "PIX" ? "PIX" : o.payment === "BOLETO" ? "Boleto" : "Cartão",
    address: o.address || {
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  };
}

export function refreshProductsFromBackend() {
  getProductsFromBackend().then((remoteProds) => {
    if (remoteProds && Array.isArray(remoteProds) && remoteProds.length > 0) {
      const mapped = remoteProds.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        category: p.category || "prata",
        price: Number(p.price || 0),
        discountPercent: Number(p.discountPercent || 0),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : Number(p.price || 0),
        originalPrice: p.price ? Number(p.price) : undefined,
        rating: p.rating ? Number(p.rating) : 5.0,
        reviewsCount: p.reviewsCount ? Number(p.reviewsCount) : 0,
        image: p.image || p.imageUrl || seedProducts[0]?.image || "",
        description: p.description || "",
        details: p.details || [],
        stockQuantity: Number(p.stockQuantity ?? 0),
        reservedQuantity: Number(p.reservedQuantity ?? 0),
        soldQuantity: Number(p.soldQuantity ?? 0),
        minimumStock: Number(p.minimumStock ?? 3),
        weight: p.weight == null ? undefined : Number(p.weight),
        height: p.height == null ? undefined : Number(p.height),
        width: p.width == null ? undefined : Number(p.width),
        length: p.length == null ? undefined : Number(p.length),
        inStock: Number(p.stockQuantity ?? 0) - Number(p.reservedQuantity ?? 0) > 0 && p.inStock !== false,
      }));
      productStore.set(mapped);
    }
  });
}

export function refreshOrdersFromBackend() {
  getOrdersFromBackend().then((remoteOrders) => {
    if (remoteOrders && Array.isArray(remoteOrders) && remoteOrders.length > 0) {
      const mapped: Order[] = remoteOrders.map(mapOrderFromBackend);
      orderStore.set(mapped);
    }
  });
}

// Initial background sync with Spring Boot backend
if (typeof window !== "undefined") {
  refreshProductsFromBackend();
  refreshOrdersFromBackend();
}

export function useProducts(): Product[] {
  return useSyncExternalStore(productStore.subscribe, productStore.get, () => seedProducts);
}

export function useOrders(): Order[] {
  return useSyncExternalStore(orderStore.subscribe, orderStore.get, () => seedOrders);
}

export const productsApi = {
  all: () => productStore.get(),
  add: async (p: Omit<Product, "id"> & { id?: string }) => {
    const id = p.id ?? crypto.randomUUID();
    const newProd = { ...p, id };
    const previous = productStore.get();
    productStore.set([newProd, ...productStore.get()]);
    try {
      await createProductInBackend(newProd);
      refreshProductsFromBackend();
    } catch (error) {
      productStore.set(previous);
      throw error;
    }
  },
  update: async (id: string, patch: Partial<Product>) => {
    const previous = productStore.get();
    productStore.set(productStore.get().map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const updated = productStore.get().find((p) => p.id === id);
    if (updated) {
      try {
        await updateProductInBackend(id, updated);
        refreshProductsFromBackend();
      } catch (error) {
        productStore.set(previous);
        throw error;
      }
    }
  },
  remove: async (id: string) => {
    const previous = productStore.get();
    productStore.set(productStore.get().filter((p) => p.id !== id));
    try {
      await deleteProductFromBackend(id);
      refreshProductsFromBackend();
    } catch (error) {
      productStore.set(previous);
      throw error;
    }
  },
};

export const ordersApi = {
  all: () => orderStore.get(),
  create: async (payload: CreateOrderInput, idempotencyKey: string): Promise<Order> => {
    const saved = await createOrderInBackend(payload, idempotencyKey);
    const order = mapOrderFromBackend(saved);
    orderStore.set([order, ...orderStore.get().filter((item) => item.id !== order.id)]);
    refreshProductsFromBackend();
    return order;
  },
  updateStatus: async (id: string, status: OrderStatus) => {
    const current = orderStore.get().find((o) => o.id === id);
    orderStore.set(orderStore.get().map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const saved = await updateOrderStatusInBackend(id, status);
      const mapped = mapOrderFromBackend(saved);
      orderStore.set(orderStore.get().map((o) => (o.id === id ? mapped : o)));
    } catch (error) {
      if (current) orderStore.set(orderStore.get().map((o) => (o.id === id ? current : o)));
      throw error;
    }

    if (current) {
      auditApi.log(
        current.number,
        "Alteração de Status",
        `Status alterado de '${current.status}' para '${status}'`,
        "admin@example.invalid"
      );
    }
  },
  updateOrder: async (id: string, patch: Partial<Order>) => {
    const current = orderStore.get().find((o) => o.id === id);
    orderStore.set(orderStore.get().map((o) => (o.id === id ? { ...o, ...patch } : o)));

    try {
      let saved: any = null;
      if (patch.status) {
        saved = await updateOrderStatusInBackend(id, patch.status);
      }
      if (patch.trackingCode !== undefined) {
        saved = await updateOrderTrackingInBackend(id, patch.trackingCode);
      }
      if (saved) {
        const mapped = mapOrderFromBackend(saved);
        orderStore.set(orderStore.get().map((o) => (o.id === id ? mapped : o)));
      }
    } catch (error) {
      if (current) orderStore.set(orderStore.get().map((o) => (o.id === id ? current : o)));
      throw error;
    }

    if (current) {
      let logMsg = "";
      if (patch.status && patch.status !== current.status) {
        logMsg += `Status: ${current.status} -> ${patch.status}. `;
      }
      if (patch.trackingCode !== undefined && patch.trackingCode !== current.trackingCode) {
        logMsg += `Rastreio registrado: ${patch.trackingCode}. `;
      }
      if (logMsg) {
        auditApi.log(current.number, "Edição do Pedido", logMsg.trim(), "admin@example.invalid");
      }
    }
  },
};
