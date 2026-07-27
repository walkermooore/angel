import { createFileRoute } from "@tanstack/react-router";
import { InstitutionalContent } from "@/components/InstitutionalContent";
import { useInstitutionalSettings } from "@/lib/institutionalStore";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Angell" }] }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const settings = useInstitutionalSettings();
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Política de Privacidade</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Última atualização: 2026</p>
      </div>

      <InstitutionalContent content={settings.privacyContent} />
    </div>
  );
}
