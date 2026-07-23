import { useSyncExternalStore } from "react";

export interface AuditLog {
  id: string;
  timestamp: string;
  orderNumber: string;
  action: string;
  user: string;
  details: string;
}

const AUDIT_KEY = "angel:audit_logs";

const seedLogs: AuditLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    orderNumber: "ANG-20260723-9482",
    action: "Criação de Pedido",
    user: "Cliente (Checkout)",
    details: "Pedido gerado via PIX com 2 itens (Total: R$ 349,10)",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    orderNumber: "ANG-20260723-9482",
    action: "Status Alterado",
    user: "admin@example.invalid",
    details: "Status atualizado para 'Pago' após verificação de pagamento",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    orderNumber: "ANG-20260723-9482",
    action: "Rastreio Inserido",
    user: "admin@example.invalid",
    details: "Código de rastreio cadastrado: AA123456789BR (Status: Enviado)",
  },
];

function loadAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return seedLogs;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(AUDIT_KEY, JSON.stringify(seedLogs));
  return seedLogs;
}

type Listener = () => void;
let state: AuditLog[] = loadAuditLogs();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
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
  return useSyncExternalStore(auditStore.subscribe, auditStore.get, () => seedLogs);
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
  },
};
