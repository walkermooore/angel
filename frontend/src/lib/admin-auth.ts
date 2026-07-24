import { useSyncExternalStore } from "react";
import { loginAdminBackend } from "./api";

const KEY = "angel:admin";
type Listener = () => void;
const listeners = new Set<Listener>();

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("angel:admin_token");
  if (localStorage.getItem(KEY) !== "1" || !token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")));
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(KEY);
      localStorage.removeItem("angel:admin_token");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(KEY);
    localStorage.removeItem("angel:admin_token");
    return false;
  }
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
  async login(email: string, password: string): Promise<boolean> {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    const res = await loginAdminBackend(cleanEmail, cleanPass);
    if (res?.success && res.token) {
      localStorage.setItem("angel:admin_token", res.token);
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
};
