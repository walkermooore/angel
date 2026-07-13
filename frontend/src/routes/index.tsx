import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const highlights = [products[0], products[3], products[2], products[5]];
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 pt-8 sm:pt-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 animate-fade-in">
            <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-6">
              Nova coleção · 2026
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
              Sofisticação em cada detalhe.
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              Peças em prata 925 e cosméticos selecionados para quem entende que
              beleza está no essencial. Bem-vinda à Angel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/produtos">Ver Coleção</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 rounded-full uppercase tracking-widest text-xs">
                <Link to="/sobre">Sobre a Angel</Link>
              </Button>
            </div>
          </div>
          <div className="order-1 md:order-2 relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/40">
            <img src={heroImg} alt="Coleção Angel" className="w-full h-full object-cover" width={1280} height={1280} />
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 mt-20 sm:mt-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-border/60">
          {[
            ["Prata 925", "Certificada"],
            ["Frete grátis", "Acima de R$ 250"],
            ["Troca fácil", "Em até 30 dias"],
            ["Embalagem", "Presente inclusa"],
          ].map(([t, s]) => (
            <div key={t} className="text-center">
              <p className="text-sm font-medium">{t}</p>
              <p className="text-xs text-muted-foreground mt-1">{s}</p>
            </div>
          ))}
        </div>
      </section>

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
          {highlights.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
