import { useSyncExternalStore } from "react";
import { getAuditLogsFromBackend, createAuditLogBackend } from "./api";

export interface AuditLog {
  id: string;
  timestamp: string;
  orderNumber: string;
  action: string;
  user: string;
  details: string;
}

const AUDIT_KEY = "angel:audit_logs";

const emptyLogs: AuditLog[] = [];

function loadAuditLogs(): AuditLog[] {
  return emptyLogs;
}

type Listener = () => void;
let state: AuditLog[] = loadAuditLogs();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

// Sync with backend API
if (typeof window !== "undefined") {
  getAuditLogsFromBackend().then((remoteLogs) => {
    if (Array.isArray(remoteLogs)) {
      state = remoteLogs;
      emit();
    }
  });
}

export const auditStore = {
  get: () => state,
  set: (next: AuditLog[]) => {
    state = next;
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
    } catch {}
    emit();
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useAuditLogs(): AuditLog[] {
  return useSyncExternalStore(auditStore.subscribe, auditStore.get, () => emptyLogs);
}

export const auditApi = {
  log: (orderNumber: string, action: string, details: string, user = "admin@example.invalid") => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      orderNumber,
      action,
      user,
      details,
    };
    auditStore.set([newLog, ...auditStore.get()]);
    createAuditLogBackend(orderNumber, action, user, details);
  },
};
