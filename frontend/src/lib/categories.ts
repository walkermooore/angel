import { useSyncExternalStore } from "react";

export type Category = "prata" | "cosmeticos" | string;

const KEY = "angel:categories";
const DEFAULT_CATEGORIES: Category[] = ["prata", "cosmeticos"];

function loadCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(KEY, JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}

function createStore<T>(key: string, initial: () => T) {
  let state = initial();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      emit();
    },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  };
}

const store = createStore<Category[]>(KEY, loadCategories);

export function useCategories(): Category[] {
  return useSyncExternalStore(store.subscribe, store.get, () => DEFAULT_CATEGORIES);
}

export const categoriesApi = {
  all: () => store.get(),
  add: (cat: string) => store.set([...store.get(), cat]),
  update: (oldCat: string, newCat: string) => {
    const list = store.get().map((c) => (c.toLowerCase() === oldCat.toLowerCase() ? newCat : c));
    store.set(list);
  },
  remove: (cat: string) => store.set(store.get().filter((c) => c.toLowerCase() !== cat.toLowerCase())),
};
