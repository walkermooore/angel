import { useSyncExternalStore } from "react";

const KEY = "angel:admin";
const ADMIN_EMAIL = "admin@example.invalid";
const ADMIN_PASS = "admin123";

type Listener = () => void;
const listeners = new Set<Listener>();

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

function emit() {
  listeners.forEach((l) => l());
}

export function useAdminAuth() {
  const isAuthed = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot,
    () => false
  );
  return { isAuthed };
}

export const adminAuth = {
  login(email: string, password: string): boolean {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === ADMIN_PASS) {
      localStorage.setItem(KEY, "1");
      emit();
      return true;
    }
    return false;
  },
  logout() {
    localStorage.removeItem(KEY);
    emit();
  },
  isAuthed: () => getSnapshot(),
  credentials: { email: ADMIN_EMAIL, password: ADMIN_PASS },
};
