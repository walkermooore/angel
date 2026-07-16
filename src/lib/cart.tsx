import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  cep: string;
  setCep: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
  add: (p: Product) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cep, setCep] = useState("");
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Persist cart lightly
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("angel:cart") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.items) setItems(parsed.items);
        if (parsed.cep) setCep(parsed.cep);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("angel:cart", JSON.stringify({ items, cep, email }));
    } catch {}
  }, [items, cep, email]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0);
    const cleanCep = cep.replace(/\D/g, "");
    const shipping = cleanCep.length === 8
      ? subtotal > 300 ? 0 : Number((15 + (parseInt(cleanCep.slice(0, 1), 10) || 0) * 2.5).toFixed(2))
      : 0;
    const total = subtotal + shipping;
    return {
      items,
      count,
      subtotal,
      shipping,
      total,
      cep,
      setCep,
      email,
      setEmail,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setOpen: setIsOpen,
      add: (p) => {
        setItems((prev) => {
          const found = prev.find((i) => i.product.id === p.id);
          if (found) return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { product: p, quantity: 1 }];
        });
        setIsOpen(true);
      },
      remove: (id) => setItems((prev) => prev.filter((i) => i.product.id !== id)),
      updateQty: (id, qty) => setItems((prev) => qty <= 0
        ? prev.filter((i) => i.product.id !== id)
        : prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i)),
      clear: () => { setItems([]); setCep(""); setEmail(""); },
    };
  }, [items, isOpen, cep, email]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });