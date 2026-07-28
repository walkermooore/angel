import { useSyncExternalStore } from "react";
import { getHomeSettingsFromBackend, saveHomeSettingsToBackend } from "./api";

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

export const emptyHomeSettings: HomeSettings = {
  heroTitle: "",
  heroDescription: "",
  heroImage: "",
  values: [],
  highlightIds: [],
};

function loadSettings(): HomeSettings {
  return emptyHomeSettings;
}

type Listener = () => void;
let state: HomeSettings = loadSettings();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function normalizeHomeSettings(remote: Partial<HomeSettings> | null): HomeSettings {
  return {
    heroTitle: remote?.heroTitle || "",
    heroDescription: remote?.heroDescription || "",
    heroImage: remote?.heroImage || "",
    values: Array.isArray(remote?.values) ? remote.values : [],
    highlightIds: Array.isArray(remote?.highlightIds) ? remote.highlightIds : [],
  };
}

export function hydrateHomeSettings(remote: Partial<HomeSettings> | null) {
  state = normalizeHomeSettings(remote);
  emit();
}

if (typeof window !== "undefined") {
  getHomeSettingsFromBackend().then(hydrateHomeSettings);
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
    saveHomeSettingsToBackend(next);
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
    () => emptyHomeSettings
  );
}

export const homeApi = {
  update: (patch: Partial<HomeSettings>) => {
    homeStore.set({ ...homeStore.get(), ...patch });
  },
};
