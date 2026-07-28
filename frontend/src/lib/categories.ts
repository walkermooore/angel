import { useSyncExternalStore } from "react";
import { getCategoriesFromBackend, createCategoryInBackend, deleteCategoryFromBackend } from "./api";

export type Category = "prata" | "cosmeticos" | string;

const KEY = "angel:categories";
const EMPTY_CATEGORIES: Category[] = [];

function loadCategories(): Category[] {
  return EMPTY_CATEGORIES;
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

if (typeof window !== "undefined") {
  getCategoriesFromBackend().then((remoteCats) => {
    if (Array.isArray(remoteCats)) setCategoriesFromBackend(remoteCats);
  });
}

export function mapCategoriesFromBackend(remoteCats: any[]): Category[] {
  return remoteCats.map((category: any) => category.name || category);
}

export function setCategoriesFromBackend(remoteCats: any[]) {
  store.set(mapCategoriesFromBackend(remoteCats));
}

export function useCategories(): Category[] {
  return useSyncExternalStore(store.subscribe, store.get, () => EMPTY_CATEGORIES);
}

export const categoriesApi = {
  all: () => store.get(),
  add: (cat: string) => {
    store.set([...store.get(), cat]);
    createCategoryInBackend(cat);
  },
  update: (oldCat: string, newCat: string) => {
    const list = store.get().map((c) => (c.toLowerCase() === oldCat.toLowerCase() ? newCat : c));
    store.set(list);
    deleteCategoryFromBackend(oldCat);
    createCategoryInBackend(newCat);
  },
  remove: (cat: string) => {
    store.set(store.get().filter((c) => c.toLowerCase() !== cat.toLowerCase()));
    deleteCategoryFromBackend(cat);
  },
};
