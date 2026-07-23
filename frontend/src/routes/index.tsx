import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useHighlights } from "@/lib/highlights";
import { useHomeSettings } from "@/lib/homeStore";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const settings = useHomeSettings();
  const highlights = useHighlights();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-8 sm:pt-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 animate-fade-in">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
              {!mounted ? "Sofisticação em cada detalhe." : settings.heroTitle}
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              {!mounted ? "Peças em prata 925 e cosméticos selecionados." : settings.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/produtos">VER PRODUTOS</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/sobre">Sobre a Angel</Link>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/40">
            {!mounted ? (
              <div className="w-full h-full bg-secondary/60 animate-pulse" />
            ) : (
              <img
                src={settings.heroImage}
                alt="Coleção Angel"
                className="w-full h-full object-cover animate-fade-in"
                loading="eager"
              />
            )}
          </div>
        </div>
      </section>

      {/* Values strip */}
      {settings.values && settings.values.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 mt-20 sm:mt-28">
          <div className="flex flex-wrap items-center justify-center gap-y-8 gap-x-12 py-8 border-y border-border/60 text-center">
            {settings.values.map((v, i) => (
              <div key={v.id || i} className="min-w-[140px] flex-1 max-w-[240px] px-2">
                <p className="text-sm font-semibold text-foreground">{v.title}</p>
                {v.subtitle && <p className="text-xs text-muted-foreground mt-1">{v.subtitle}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Highlights */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 mt-20 sm:mt-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">Destaques</p>
            <h2 className="font-display text-4xl sm:text-5xl">Selecionados para você</h2>
          </div>
          <Link to="/produtos" className="hidden sm:inline-block text-sm underline underline-offset-4 hover:no-underline">
            Ver tudo
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {!mounted
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-secondary/40 animate-pulse" />
              ))
            : highlights.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
        </div>
      </section>
    </div>
  );
}
