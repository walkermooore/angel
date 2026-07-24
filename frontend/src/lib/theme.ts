import { useSyncExternalStore, useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "angel:theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY) as Theme;
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<() => void>();

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const themeStore = {
  get: () => currentTheme,
  set: (theme: Theme) => {
    currentTheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    applyTheme(theme);
    listeners.forEach((l) => l());
  },
  toggle: () => {
    themeStore.set(currentTheme === "dark" ? "light" : "dark");
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// Initialize theme class on load
if (typeof window !== "undefined") {
  applyTheme(currentTheme);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.get,
    () => "dark"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(currentTheme);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: themeStore.toggle,
    setTheme: themeStore.set,
    mounted,
  };
}
