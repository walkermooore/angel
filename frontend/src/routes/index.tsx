import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { getHomeSettingsFromBackend, getProductsFromBackend } from "@/lib/api";
import { emptyHomeSettings, hydrateHomeSettings, normalizeHomeSettings } from "@/lib/homeStore";
import { isProductAvailable } from "@/lib/products";
import { mapProductFromBackend, setProductsFromBackend } from "@/lib/store";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [remoteSettings, remoteProducts] = await Promise.all([
      getHomeSettingsFromBackend(),
      getProductsFromBackend(),
    ]);
    return {
      settings: normalizeHomeSettings(remoteSettings),
      products: Array.isArray(remoteProducts) ? remoteProducts.map(mapProductFromBackend) : null,
      unavailable: remoteSettings === null || remoteProducts === null,
    };
  },
  component: Index,
});

function Index() {
  const { settings, products, unavailable } = Route.useLoaderData();
  const safeSettings = settings ?? emptyHomeSettings;
  const highlights = (products ?? []).filter((product) =>
    safeSettings.highlightIds.includes(product.id) && isProductAvailable(product)
  );

  useEffect(() => {
    hydrateHomeSettings(safeSettings);
    if (products) setProductsFromBackend(products);
  }, [safeSettings, products]);

  if (unavailable) {
    return <HomeSkeleton />;
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-8 sm:pt-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 animate-fade-in">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
              {safeSettings.heroTitle}
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              {safeSettings.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/produtos">VER PRODUTOS</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/sobre">Sobre a Angell</Link>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/40">
            {safeSettings.heroImage ? (
              <img
                src={safeSettings.heroImage}
                alt="Coleção Angell"
                className="w-full h-full object-cover animate-fade-in"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-secondary/40" aria-label="Imagem não disponível" />
            )}
          </div>
        </div>
      </section>

      {/* Values strip */}
      {safeSettings.values.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 sm:px-8 mt-20 sm:mt-28">
          <div className="flex flex-wrap items-center justify-center gap-y-8 gap-x-12 py-8 border-y border-border/60 text-center">
            {safeSettings.values.map((v, i) => (
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
          {highlights.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-8 sm:pt-16" role="status" aria-label="Carregando conteúdo">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="space-y-5">
          <div className="h-16 max-w-lg rounded-xl bg-secondary/50 animate-pulse" />
          <div className="h-20 max-w-md rounded-xl bg-secondary/40 animate-pulse" />
        </div>
        <div className="aspect-[4/5] rounded-2xl bg-secondary/50 animate-pulse" />
      </div>
    </div>
  );
}
