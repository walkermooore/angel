import { useSyncExternalStore } from "react";
import { loginAdminBackend } from "./api";

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

    // Call backend API (async in background) while maintaining synchronous return
    loginAdminBackend(cleanEmail, cleanPass).then((res) => {
      if (res && res.success && res.token) {
        localStorage.setItem("angel:admin_token", res.token);
      }
    });

    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanPass === ADMIN_PASS) {
      localStorage.setItem(KEY, "1");
      emit();
      return true;
    }
    return false;
  },
  logout() {
    localStorage.removeItem(KEY);
    localStorage.removeItem("angel:admin_token");
    emit();
  },
  isAuthed: () => getSnapshot(),
  credentials: { email: ADMIN_EMAIL, password: ADMIN_PASS },
};
