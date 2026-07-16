import { useSyncExternalStore } from "react";
import { products as seedProducts, type Product } from "./products";

export type OrderStatus = "Pendente" | "Pago" | "Enviado" | "Concluído";
export interface OrderItem { productId: string; name: string; price: number; quantity: number; image: string; }
export interface Order {
  id: string;
  number: string;
  email: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  payment: "PIX" | "Cartão" | "Boleto";
  address: {
    cep: string; street: string; number: string; complement?: string;
    neighborhood: string; city: string; state: string;
  };
}

const PRODUCTS_KEY = "angel:products";
const ORDERS_KEY = "angel:orders";

function loadProducts(): Product[] {
  if (typeof window === "undefined") return seedProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seedProducts));
  return seedProducts;
}
function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); } catch { return []; }
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
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      emit();
    },
    subscribe: (l: Listener) => { listeners.add(l); return () => listeners.delete(l); },
  };
}

const productStore = createStore<Product[]>(PRODUCTS_KEY, loadProducts);
const orderStore = createStore<Order[]>(ORDERS_KEY, loadOrders);

// SSR-safe snapshot
const emptyProducts: Product[] = seedProducts;
const emptyOrders: Order[] = [];

export function useProducts(): Product[] {
  return useSyncExternalStore(
    productStore.subscribe,
    productStore.get,
    () => emptyProducts
  );
}
export function useOrders(): Order[] {
  return useSyncExternalStore(
    orderStore.subscribe,
    orderStore.get,
    () => emptyOrders
  );
}

export const productsApi = {
  all: () => productStore.get(),
  add: (p: Omit<Product, "id"> & { id?: string }) => {
    const id = p.id ?? crypto.randomUUID();
    productStore.set([{ ...p, id }, ...productStore.get()]);
  },
  update: (id: string, patch: Partial<Product>) => {
    productStore.set(productStore.get().map((p) => p.id === id ? { ...p, ...patch } : p));
  },
  remove: (id: string) => {
    productStore.set(productStore.get().filter((p) => p.id !== id));
  },
};

export const ordersApi = {
  all: () => orderStore.get(),
  create: (o: Omit<Order, "id" | "number" | "createdAt" | "status"> & { status?: OrderStatus }): Order => {
    const now = new Date();
    const number = `ANG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const order: Order = { ...o, id: crypto.randomUUID(), number, createdAt: now.toISOString(), status: o.status ?? "Pendente" };
    orderStore.set([order, ...orderStore.get()]);
    return order;
  },
  updateStatus: (id: string, status: OrderStatus) => {
    orderStore.set(orderStore.get().map((o) => o.id === id ? { ...o, status } : o));
  },
};
