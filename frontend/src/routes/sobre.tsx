import { createFileRoute } from "@tanstack/react-router";
import aboutImg from "@/assets/about.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Nós — Angel" },
      { name: "description", content: "Conheça a história da Angel: joias em prata 925 e cosméticos com sofisticação minimalista." },
      { property: "og:title", content: "Sobre Nós — Angel" },
      { property: "og:description", content: "A história por trás da Angel." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-16">
      <div className="max-w-2xl">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">Nossa história</p>
        <h1 className="font-display text-5xl sm:text-6xl leading-tight">
          Beleza é fazer do essencial algo memorável.
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16 mt-16 items-start">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary/40 order-2 md:order-1">
          <img src={aboutImg} alt="Loja Angel" className="w-full h-full object-cover" width={1200} height={900} loading="lazy" />
        </div>
        <div className="order-1 md:order-2 space-y-5 text-muted-foreground leading-relaxed">
          <p>
            A <span className="text-foreground font-medium">Angel</span> nasceu em 2019 do desejo de criar peças que
            atravessassem o tempo — joias em prata 925 e cosméticos pensados
            para o cuidado diário, sem excessos.
          </p>
          <p>
            Cada colar, anel ou frasco é escolhido a dedo. Trabalhamos com
            ateliês independentes no Brasil e na Europa, garantindo materiais
            certificados, acabamentos impecáveis e uma produção consciente.
          </p>
          <p>
            Acreditamos que sofisticação não é sobre acumular, é sobre escolher
            bem. É por isso que nossa coleção é curta, curada e feita para
            durar.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/60">
            <div>
              <p className="font-display text-3xl text-foreground">2019</p>
              <p className="text-xs mt-1">Fundação</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">12k+</p>
              <p className="text-xs mt-1">Clientes</p>
            </div>
            <div>
              <p className="font-display text-3xl text-foreground">100%</p>
              <p className="text-xs mt-1">Prata 925</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}