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

const defaultAboutSettings: AboutSettings = {
  subtitle: "Nossa história",
  title: "Beleza é fazer do essencial algo memorável.",
  imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
  paragraph1: "A Angell nasceu em 2019 do desejo de criar peças que atravessassem o tempo — joias em prata 925 e cosméticos pensados para o cuidado diário, sem excessos.",
  paragraph2: "Cada colar, anel ou frasco é escolhido a dedo. Trabalhamos com ateliês independentes no Brasil e na Europa, garantindo materiais certificados, acabamentos impecáveis e uma produção consciente.",
  paragraph3: "Acreditamos que sofisticação não é sobre acumular, é sobre escolher bem. É por isso que nossa coleção é curta, curada e feita para durar.",
  stat1Number: "2019",
  stat1Label: "Fundação",
  stat2Number: "12k+",
  stat2Label: "Clientes",
  stat3Number: "100%",
  stat3Label: "Prata 925",
};

let currentAboutSettings: AboutSettings = defaultAboutSettings;
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
    () => defaultAboutSettings
  );
}

export function refreshAboutSettingsFromBackend() {
  getAboutSettingsFromBackend().then((res) => {
    if (res) {
      currentAboutSettings = {
        subtitle: res.subtitle || defaultAboutSettings.subtitle,
        title: res.title || defaultAboutSettings.title,
        imageUrl: res.imageUrl || defaultAboutSettings.imageUrl,
        paragraph1: res.paragraph1 || defaultAboutSettings.paragraph1,
        paragraph2: res.paragraph2 || defaultAboutSettings.paragraph2,
        paragraph3: res.paragraph3 || defaultAboutSettings.paragraph3,
        stat1Number: res.stat1Number || defaultAboutSettings.stat1Number,
        stat1Label: res.stat1Label || defaultAboutSettings.stat1Label,
        stat2Number: res.stat2Number || defaultAboutSettings.stat2Number,
        stat2Label: res.stat2Label || defaultAboutSettings.stat2Label,
        stat3Number: res.stat3Number || defaultAboutSettings.stat3Number,
        stat3Label: res.stat3Label || defaultAboutSettings.stat3Label,
      };
      emit();
    }
  });
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
