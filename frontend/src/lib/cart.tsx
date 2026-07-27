import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./products";
import type { ShippingOption } from "./store";
import { toast } from "sonner";
import { trackFunnel } from "./funnel";

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
  phone: string;
  setPhone: (v: string) => void;
  shippingOption: ShippingOption;
  setShippingOption: (opt: ShippingOption) => void;
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
  const [phone, setPhone] = useState("");
  const [shippingOption, setShippingOption] = useState<ShippingOption>("entrega");
  const [isOpen, setIsOpen] = useState(false);

  // Persist cart
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("angel:cart") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.items) setItems(parsed.items);
        if (parsed.cep) setCep(parsed.cep);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.shippingOption) setShippingOption(parsed.shippingOption);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("angel:cart", JSON.stringify({ items, cep, phone, shippingOption }));
    } catch {}
  }, [items, cep, phone, shippingOption]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.quantity * (i.product.discountPrice ?? i.product.price), 0);
    const cleanCep = cep.replace(/\D/g, "");

    let shipping = 0;
    if (shippingOption === "entrega") {
      shipping = cleanCep.length === 8
        ? subtotal >= 250 ? 0 : Number((15 + (parseInt(cleanCep.slice(0, 1), 10) || 0) * 2.5).toFixed(2))
        : 0;
    } else {
      shipping = 0; // Retirar na Loja is 100% FREE
    }

    const total = subtotal + shipping;

    return {
      items,
      count,
      subtotal,
      shipping,
      total,
      cep,
      setCep,
      phone,
      setPhone,
      shippingOption,
      setShippingOption,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setOpen: setIsOpen,
      add: (p) => {
        setItems((prev) => {
          const found = prev.find((i) => i.product.id === p.id);
          const available = Math.max(0, p.stockQuantity ?? 0);
          if (available === 0 || p.inStock === false) {
            toast.error("Este produto está sem estoque.");
            return prev;
          }
          if (found) {
            if (found.quantity >= available) {
              toast.info(`Há somente ${available} unidade(s) disponível(is).`);
              return prev;
            }
            return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { product: p, quantity: 1 }];
        });
        trackFunnel("CART_ITEM_ADDED", p.category);
        setIsOpen(true);
      },
      remove: (id) => setItems((prev) => {
        const removed = prev.find((item) => item.product.id === id);
        if (removed) trackFunnel("CART_ITEM_REMOVED", removed.product.category);
        return prev.filter((i) => i.product.id !== id);
      }),
      updateQty: (id, qty) => setItems((prev) => {
        if (qty <= 0) return prev.filter((i) => i.product.id !== id);
        return prev.map((item) => {
          if (item.product.id !== id) return item;
          const available = Math.max(0, item.product.stockQuantity ?? 0);
          if (qty > available) {
            toast.info(`Há somente ${available} unidade(s) disponível(is).`);
            return { ...item, quantity: available };
          }
          return { ...item, quantity: qty };
        }).filter((item) => item.quantity > 0);
      }),
      clear: () => { setItems([]); setCep(""); setPhone(""); setShippingOption("entrega"); },
    };
  }, [items, isOpen, cep, phone, shippingOption]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
