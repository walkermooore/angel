import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { readCookieConsent, revokeCookieConsent, saveCookieConsent } from "@/lib/cookie-consent";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política e preferências de cookies — Angell" },
      { name: "description", content: "Consulte e altere suas preferências de cookies na Angell." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const current = readCookieConsent();
  const [analytics, setAnalytics] = useState(current?.analytics ?? false);
  const [marketing, setMarketing] = useState(current?.marketing ?? false);
  const [preferences, setPreferences] = useState(current?.preferences ?? false);
  const [saved, setSaved] = useState(false);

  const persist = () => {
    saveCookieConsent({ analytics, marketing, preferences });
    setSaved(true);
  };

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Cookies e preferências</h1>
        <p className="mt-4 text-muted-foreground">Última atualização: 27 de julho de 2026.</p>
      </header>
      <p>Atualmente a Angell utiliza apenas armazenamento estritamente necessário para sacola, segurança do painel e funcionamento da interface. Não há pixels de publicidade ou analytics habilitados.</p>
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Suas escolhas</h2>
        <label className="flex gap-3"><input type="checkbox" checked disabled /> <span><strong>Necessários</strong><br/><small>Login seguro, sacola e funcionamento do site. Sempre ativos.</small></span></label>
        <label className="flex gap-3"><input type="checkbox" checked={preferences} onChange={e => setPreferences(e.target.checked)} /> <span><strong>Preferências</strong><br/><small>Personalização opcional da experiência.</small></span></label>
        <label className="flex gap-3"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /> <span><strong>Analytics</strong><br/><small>Medição opcional de uso. Nenhuma ferramenta está instalada atualmente.</small></span></label>
        <label className="flex gap-3"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /> <span><strong>Marketing</strong><br/><small>Publicidade e remarketing. Nenhuma ferramenta está instalada atualmente.</small></span></label>
        <div className="flex flex-wrap gap-3">
          <Button onClick={persist}>Salvar preferências</Button>
          <Button variant="outline" onClick={() => { setAnalytics(false); setMarketing(false); setPreferences(false); saveCookieConsent({ analytics: false, marketing: false, preferences: false }); setSaved(true); }}>Rejeitar opcionais</Button>
          <Button variant="ghost" onClick={() => { revokeCookieConsent(); setSaved(true); }}>Revogar escolha</Button>
        </div>
        {saved && <p role="status" aria-live="polite" className="text-sm text-emerald-600">Preferências atualizadas.</p>}
      </section>
      <p className="text-sm text-muted-foreground">Novos rastreadores somente poderão ser carregados após consulta a essas preferências. Consulte também a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</p>
    </article>
  );
}
