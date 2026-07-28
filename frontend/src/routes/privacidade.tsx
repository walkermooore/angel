import { createFileRoute } from "@tanstack/react-router";
import { InstitutionalContent } from "@/components/InstitutionalContent";
import { getInstitutionalSettingsFromBackend } from "@/lib/api";
import { normalizeInstitutionalSettings } from "@/lib/institutionalStore";

export const Route = createFileRoute("/privacidade")({
  loader: async () => {
    const remote = await getInstitutionalSettingsFromBackend();
    return { settings: normalizeInstitutionalSettings(remote), unavailable: remote === null };
  },
  head: () => ({ meta: [{ title: "Política de Privacidade — Angell" }] }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const { settings, unavailable } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Política de Privacidade</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Última atualização: 2026</p>
      </div>

      {unavailable ? <div className="h-72 rounded-xl bg-secondary/50 animate-pulse" role="status" aria-label="Carregando conteúdo" /> : <InstitutionalContent content={settings.privacyContent} />}
    </div>
  );
}
