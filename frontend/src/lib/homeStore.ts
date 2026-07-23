import { useSyncExternalStore } from "react";
import heroImg from "@/assets/hero.jpg";

export interface ValueItem {
  id?: string;
  title: string;
  subtitle: string;
}

export interface HomeSettings {
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  values: ValueItem[];
  highlightIds: string[];
}

const HOME_KEY = "angel:home_settings";

const defaultSettings: HomeSettings = {
  heroTitle: "Sofisticação em cada detalhe.",
  heroDescription:
    "Peças em prata 925 e cosméticos selecionados para quem entende que beleza está no essencial. Bem-vinda à Angel.",
  heroImage: heroImg,
  values: [
    { id: "v-1", title: "Prata 925", subtitle: "Certificada" },
    { id: "v-2", title: "Frete grátis", subtitle: "Acima de R$ 250" },
    { id: "v-3", title: "Troca fácil", subtitle: "Em até 30 dias" },
    { id: "v-4", title: "Embalagem", subtitle: "Presente inclusa" },
  ],
  highlightIds: ["1", "2", "3", "4"],
};

function loadSettings(): HomeSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(HOME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultSettings,
        ...parsed,
        values: Array.isArray(parsed.values) && parsed.values.length > 0 ? parsed.values : defaultSettings.values,
        highlightIds:
          Array.isArray(parsed.highlightIds) && parsed.highlightIds.length >= 1 && parsed.highlightIds.length <= 5
            ? parsed.highlightIds
            : defaultSettings.highlightIds,
      };
    }
  } catch {}
  localStorage.setItem(HOME_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
}

type Listener = () => void;
let state: HomeSettings = loadSettings();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const homeStore = {
  get: () => state,
  set: (next: HomeSettings) => {
    state = next;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(HOME_KEY, JSON.stringify(next));
      }
    } catch {}
    emit();
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useHomeSettings(): HomeSettings {
  return useSyncExternalStore(
    homeStore.subscribe,
    homeStore.get,
    () => defaultSettings
  );
}

export const homeApi = {
  update: (patch: Partial<HomeSettings>) => {
    homeStore.set({ ...homeStore.get(), ...patch });
  },
};
