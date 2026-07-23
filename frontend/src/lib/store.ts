import { useSyncExternalStore } from "react";
import { products as seedProducts, type Product } from "./products";
import { auditApi } from "./auditStore";

export type OrderStatus = "Pendente" | "Pago" | "Enviado" | "Concluído";
export type ShippingOption = "entrega" | "retirada";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
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
  shippingOption?: ShippingOption;
  trackingCode?: string;
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

const PRODUCTS_KEY = "angel:products";
const ORDERS_KEY = "angel:orders";

const seedOrders: Order[] = [
  {
    id: "ord-1",
    number: "ANG-20260723-9482",
    email: "[contato removido]",
    createdAt: new Date().toISOString(),
    items: [
      { productId: "1", name: "Colar Éclat Prata 925", price: 170.1, quantity: 1, image: seedProducts[0]?.image || "" },
      { productId: "4", name: "Sérum Radiance Angel", price: 179, quantity: 1, image: seedProducts[3]?.image || "" },
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
  if (typeof window === "undefined") return seedOrders;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(ORDERS_KEY, JSON.stringify(seedOrders));
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

export function useProducts(): Product[] {
  return useSyncExternalStore(productStore.subscribe, productStore.get, () => seedProducts);
}

export function useOrders(): Order[] {
  return useSyncExternalStore(orderStore.subscribe, orderStore.get, () => seedOrders);
}

export const productsApi = {
  all: () => productStore.get(),
  add: (p: Omit<Product, "id"> & { id?: string }) => {
    const id = p.id ?? crypto.randomUUID();
    productStore.set([{ ...p, id }, ...productStore.get()]);
  },
  update: (id: string, patch: Partial<Product>) => {
    productStore.set(productStore.get().map((p) => (p.id === id ? { ...p, ...patch } : p)));
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
    const order: Order = {
      ...o,
      id: crypto.randomUUID(),
      number,
      createdAt: now.toISOString(),
      status: o.status ?? "Pendente",
    };
    orderStore.set([order, ...orderStore.get()]);

    // Record audit log
    auditApi.log(
      number,
      "Criação de Pedido",
      `Pedido criado via ${o.payment} com total de R$ ${o.total.toFixed(2)}`,
      "Cliente (Checkout)"
    );

    return order;
  },
  updateStatus: (id: string, status: OrderStatus) => {
    const current = orderStore.get().find((o) => o.id === id);
    orderStore.set(orderStore.get().map((o) => (o.id === id ? { ...o, status } : o)));

    if (current) {
      auditApi.log(
        current.number,
        "Alteração de Status",
        `Status alterado de '${current.status}' para '${status}'`,
        "admin@example.invalid"
      );
    }
  },
  updateOrder: (id: string, patch: Partial<Order>) => {
    const current = orderStore.get().find((o) => o.id === id);
    orderStore.set(orderStore.get().map((o) => (o.id === id ? { ...o, ...patch } : o)));

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
