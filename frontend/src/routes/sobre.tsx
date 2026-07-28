import { createFileRoute } from "@tanstack/react-router";
import { getAboutSettingsFromBackend } from "@/lib/api";
import { hydrateAboutSettings, normalizeAboutSettings } from "@/lib/aboutStore";
import { useEffect } from "react";

export const Route = createFileRoute("/sobre")({
  loader: async () => {
    const remote = await getAboutSettingsFromBackend();
    return { about: normalizeAboutSettings(remote), unavailable: remote === null };
  },
  head: () => ({
    meta: [
      { title: "Sobre Nós — Angell" },
      { name: "description", content: "Conheça a história da Angell: joias em prata 925 e cosméticos com sofisticação minimalista." },
      { property: "og:title", content: "Sobre Nós — Angell" },
      { property: "og:description", content: "A história por trás da Angell." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  const { about, unavailable } = Route.useLoaderData();
  useEffect(() => hydrateAboutSettings(about), [about]);

  if (unavailable) {
    return <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16"><div className="h-96 rounded-2xl bg-secondary/50 animate-pulse" role="status" aria-label="Carregando conteúdo" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-16 pb-20">
      <div className="max-w-2xl">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">{about.subtitle}</p>
        <h1 className="font-display text-5xl sm:text-6xl leading-tight">
          {about.title}
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16 mt-16 items-start">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary/40 order-2 md:order-1 border border-border/60">
          {about.imageUrl ? <img src={about.imageUrl} alt="Sobre a Angell" className="w-full h-full object-cover" width={1200} height={900} loading="lazy" /> : null}
        </div>
        <div className="order-1 md:order-2 space-y-5 text-muted-foreground leading-relaxed">
          <p>{about.paragraph1}</p>
          <p>{about.paragraph2}</p>
          <p>{about.paragraph3}</p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/60">
            <div>
              <p className="font-display text-3xl text-foreground">{about.stat1Number}</p>
              <p className="text-xs mt-1">{about.stat1Label}</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">{about.stat2Number}</p>
              <p className="text-xs mt-1">{about.stat2Label}</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">{about.stat3Number}</p>
              <p className="text-xs mt-1">{about.stat3Label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
