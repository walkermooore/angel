import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { type Category } from "@/lib/products";
import { useProducts } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Angel" },
      { name: "description", content: "Explore joias de prata 925 e cosméticos selecionados pela Angel." },
      { property: "og:title", content: "Produtos — Angel" },
      { property: "og:description", content: "Explore joias de prata e cosméticos da Angel." },
    ],
  }),
  component: ProdutosPage,
});

type Filter = Category | "todos";
type Sort = "destaque" | "menor" | "maior" | "nome";

function ProdutosPage() {
  const products = useProducts();
  const [filter, setFilter] = useState<Filter>("todos");
  const [range, setRange] = useState<[number, number]>([0, 300]);
  const [sort, setSort] = useState<Sort>("destaque");

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const catOk = filter === "todos" || p.category === filter;
      const priceOk = p.price >= range[0] && p.price <= range[1];
      return catOk && priceOk;
    });
    const sorted = [...list];
    if (sort === "menor") sorted.sort((a, b) => a.price - b.price);
    if (sort === "maior") sorted.sort((a, b) => b.price - a.price);
    if (sort === "nome") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filter, range, sort, products]);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-16">
      <div className="mb-12">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">Coleção</p>
        <h1 className="font-display text-5xl sm:text-6xl">Todos os produtos</h1>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="space-y-8">
          <div>
            <h3 className="text-xs uppercase tracking-widest mb-4">Categoria</h3>
            <ul className="space-y-2">
              {([
                ["todos", "Todos"],
                ["prata", "Prata"],
                ["cosmeticos", "Cosméticos"],
              ] as const).map(([v, l]) => (
                <li key={v}>
                  <button
                    onClick={() => setFilter(v)}
                    className={cn(
                      "text-sm transition-colors hover:text-foreground",
                      filter === v ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest mb-4">Faixa de preço</h3>
            <Slider
              min={0}
              max={300}
              step={10}
              value={range}
              onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-3 tabular-nums">
              <span>R$ {range[0]}</span>
              <span>R$ {range[1]}</span>
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground">{filtered.length} produto{filtered.length === 1 ? "" : "s"}</p>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="destaque">Em destaque</SelectItem>
                <SelectItem value="menor">Menor preço</SelectItem>
                <SelectItem value="maior">Maior preço</SelectItem>
                <SelectItem value="nome">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}