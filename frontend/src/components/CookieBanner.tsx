import { Link } from "@tanstack/react-router";
import { Cookie, Settings2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";

type Choices = {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

const optionalDisabled: Choices = {
  preferences: false,
  analytics: false,
  marketing: false,
};

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState<Choices>(optionalDisabled);

  useEffect(() => {
    const synchronize = () => {
      const current = readCookieConsent();
      if (current) {
        setChoices({
          preferences: current.preferences,
          analytics: current.analytics,
          marketing: current.marketing,
        });
        setVisible(false);
        return;
      }
      setVisible(true);
    };
    synchronize();
    window.addEventListener("angell:cookie-consent", synchronize);
    return () => window.removeEventListener("angell:cookie-consent", synchronize);
  }, []);

  const persist = (next: Choices) => {
    saveCookieConsent(next);
    setChoices(next);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Preferências de cookies"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-4xl rounded-2xl border bg-background/95 p-4 shadow-2xl backdrop-blur sm:bottom-5 sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="hidden rounded-full bg-primary/10 p-3 text-primary sm:block">
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary sm:hidden" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold">Sua privacidade, sua escolha</h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Usamos o armazenamento necessário para a sacola e a segurança do site. Os demais recursos
            só serão ativados se você permitir.
          </p>

          {customizing && (
            <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-3">
              <Choice
                label="Preferências"
                description="Lembra ajustes da experiência."
                checked={choices.preferences}
                onChange={(checked) => setChoices((current) => ({ ...current, preferences: checked }))}
              />
              <Choice
                label="Analytics"
                description="Ajuda a entender o uso do site."
                checked={choices.analytics}
                onChange={(checked) => setChoices((current) => ({ ...current, analytics: checked }))}
              />
              <Choice
                label="Marketing"
                description="Permite campanhas personalizadas."
                checked={choices.marketing}
                onChange={(checked) => setChoices((current) => ({ ...current, marketing: checked }))}
              />
              <p className="text-xs text-muted-foreground sm:col-span-3">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                Cookies necessários permanecem ativos para o site funcionar.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" onClick={() => persist({ preferences: true, analytics: true, marketing: true })}>
              Aceitar todos
            </Button>
            <Button type="button" variant="outline" onClick={() => persist(optionalDisabled)}>
              Somente necessários
            </Button>
            {customizing ? (
              <Button type="button" variant="secondary" onClick={() => persist(choices)}>
                Salvar minhas escolhas
              </Button>
            ) : (
              <Button type="button" variant="ghost" className="gap-2" onClick={() => setCustomizing(true)}>
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Personalizar
              </Button>
            )}
            <Link to="/cookies" className="px-2 text-center text-xs text-muted-foreground underline underline-offset-4 sm:ml-auto">
              Saiba como usamos cookies
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Choice({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-secondary/30">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
