import { useSyncExternalStore } from "react";
import { getAboutSettingsFromBackend, saveAboutSettingsToBackend } from "./api";

export interface AboutSettings {
  subtitle: string;
  title: string;
  imageUrl: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  stat1Number: string;
  stat1Label: string;
  stat2Number: string;
  stat2Label: string;
  stat3Number: string;
  stat3Label: string;
}

export const emptyAboutSettings: AboutSettings = {
  subtitle: "",
  title: "",
  imageUrl: "",
  paragraph1: "",
  paragraph2: "",
  paragraph3: "",
  stat1Number: "",
  stat1Label: "",
  stat2Number: "",
  stat2Label: "",
  stat3Number: "",
  stat3Label: "",
};

let currentAboutSettings: AboutSettings = emptyAboutSettings;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useAboutSettings(): AboutSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentAboutSettings,
    () => emptyAboutSettings
  );
}

export function refreshAboutSettingsFromBackend() {
  getAboutSettingsFromBackend().then((res) => {
    if (res) hydrateAboutSettings(res);
  });
}

export function normalizeAboutSettings(res: Partial<AboutSettings> | null): AboutSettings {
  return { ...emptyAboutSettings, ...(res || {}) };
}

export function hydrateAboutSettings(res: Partial<AboutSettings> | null) {
  currentAboutSettings = normalizeAboutSettings(res);
  emit();
}

// Initial sync
if (typeof window !== "undefined") {
  refreshAboutSettingsFromBackend();
}

export const aboutApi = {
  get: () => currentAboutSettings,
  save: async (settings: Partial<AboutSettings>) => {
    currentAboutSettings = { ...currentAboutSettings, ...settings };
    emit();
    await saveAboutSettingsToBackend(currentAboutSettings);
    refreshAboutSettingsFromBackend();
  },
};
