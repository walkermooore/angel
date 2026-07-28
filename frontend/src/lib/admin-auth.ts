import { useSyncExternalStore } from "react";
import { loginAdminBackend, logoutAdminBackend } from "./api";

const KEY = "angel:admin";
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
  async login(email: string, password: string, totpCode?: string): Promise<"success" | "requiresTwoFactor"> {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = password || "";

    try {
      const res = await loginAdminBackend(cleanEmail, cleanPass, totpCode);
      if (res?.success && res.csrfToken) {
        localStorage.setItem("angel:csrf_token", res.csrfToken);
        localStorage.setItem(KEY, "1");
        emit();
        return "success";
      }
    } catch (error) {
      if (!totpCode && error instanceof Error && /código de autenticação|duas etapas/i.test(error.message)) {
        return "requiresTwoFactor";
      }
      throw error;
    }
    throw new Error("Credenciais inválidas.");
  },
  async logout() {
    await logoutAdminBackend().catch(() => null);
    localStorage.removeItem(KEY);
    localStorage.removeItem("angel:csrf_token");
    emit();
  },
  isAuthed: () => getSnapshot(),
};
