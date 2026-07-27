export type CookieCategory = "necessary" | "analytics" | "marketing" | "preferences";

export interface CookieConsent {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  updatedAt: string;
}

const KEY = "angell:cookie-consent:v1";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") as CookieConsent | null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: Omit<CookieConsent, "version" | "updatedAt">): void {
  localStorage.setItem(KEY, JSON.stringify({
    version: 1,
    ...consent,
    updatedAt: new Date().toISOString(),
  } satisfies CookieConsent));
  window.dispatchEvent(new Event("angell:cookie-consent"));
}

export function canUseCookieCategory(category: CookieCategory): boolean {
  if (category === "necessary") return true;
  return readCookieConsent()?.[category] === true;
}

export function revokeCookieConsent(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("angell:cookie-consent"));
}
