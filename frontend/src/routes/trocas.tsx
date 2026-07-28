import { createFileRoute } from "@tanstack/react-router";
import { InstitutionalContent } from "@/components/InstitutionalContent";
import { getInstitutionalSettingsFromBackend } from "@/lib/api";
import { normalizeInstitutionalSettings } from "@/lib/institutionalStore";

export const Route = createFileRoute("/trocas")({
  loader: async () => {
    const remote = await getInstitutionalSettingsFromBackend();
    return { settings: normalizeInstitutionalSettings(remote), unavailable: remote === null };
  },
  head: () => ({ meta: [{ title: "Trocas e Devoluções — Angell" }] }),
  component: TrocasPage,
});

function TrocasPage() {
  const { settings, unavailable } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Trocas e Devoluções</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Política de Satisfação Garantida</p>
      </div>

      {unavailable ? <div className="h-72 rounded-xl bg-secondary/50 animate-pulse" role="status" aria-label="Carregando conteúdo" /> : <InstitutionalContent content={settings.exchangesContent} />}
    </div>
  );
}
