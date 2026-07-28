import { useSyncExternalStore } from "react";
import {
  getInstitutionalSettingsFromBackend,
  saveInstitutionalSettingsToBackend,
} from "./api";

export type InstitutionalSettings = {
  termsContent: string;
  exchangesContent: string;
  privacyContent: string;
};

export const institutionalDefaults: InstitutionalSettings = {
  termsContent: "",
  exchangesContent: "",
  privacyContent: "",
};

let state = institutionalDefaults;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export async function refreshInstitutionalSettings() {
  const remote = await getInstitutionalSettingsFromBackend();
  hydrateInstitutionalSettings(remote);
  loaded = true;
  return state;
}

export function normalizeInstitutionalSettings(remote: Partial<InstitutionalSettings> | null): InstitutionalSettings {
  return {
    termsContent: remote?.termsContent || "",
    exchangesContent: remote?.exchangesContent || "",
    privacyContent: remote?.privacyContent || "",
  };
}

export function hydrateInstitutionalSettings(remote: Partial<InstitutionalSettings> | null) {
  state = normalizeInstitutionalSettings(remote);
  emit();
}

export function useInstitutionalSettings() {
  const settings = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => institutionalDefaults
  );

  if (typeof window !== "undefined" && !loaded) {
    void refreshInstitutionalSettings();
  }

  return settings;
}

export async function saveInstitutionalSettings(settings: InstitutionalSettings) {
  const saved = await saveInstitutionalSettingsToBackend(settings);
  state = {
    termsContent: saved.termsContent,
    exchangesContent: saved.exchangesContent,
    privacyContent: saved.privacyContent,
  };
  loaded = true;
  emit();
  return state;
}
