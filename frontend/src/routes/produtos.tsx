import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useProducts } from "@/lib/store";
import { useCategories } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

type FilterCategory = string;
type DiscountFilter = "todos" | "com-desconto" | "10-ou-mais" | "20-ou-mais";
type Sort = "destaque" | "menor" | "maior" | "nome";

function ProdutosPage() {
  const products = useProducts();
  const categories = useCategories();

  const [filterCat, setFilterCat] = useState<FilterCategory>("todos");
  const [filterDiscount, setFilterDiscount] = useState<DiscountFilter>("todos");
  const [range, setRange] = useState<[number, number]>([0, 300]);
  const [tempRange, setTempRange] = useState<[number, number]>([0, 300]);
  const [sort, setSort] = useState<Sort>("destaque");

  useEffect(() => {
    const timer = setTimeout(() => {
      setRange(tempRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [tempRange]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const catOk = filterCat === "todos" || p.category.toLowerCase() === filterCat.toLowerCase();

      const effectivePrice = p.discountPrice ?? p.price;
      const priceOk = effectivePrice >= range[0] && effectivePrice <= range[1];

      let discountOk = true;
      const percent = p.discountPercent || 0;
      if (filterDiscount === "com-desconto") discountOk = percent > 0;
      if (filterDiscount === "10-ou-mais") discountOk = percent >= 10;
      if (filterDiscount === "20-ou-mais") discountOk = percent >= 20;

      return catOk && priceOk && discountOk;
    });

    const sorted = [...list];
    if (sort === "menor") sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    if (sort === "maior") sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    if (sort === "nome") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filterCat, filterDiscount, range, sort, products]);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-10 sm:pt-16">
      <div className="mb-12">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">Coleção</p>
        <h1 className="font-display text-5xl sm:text-6xl">Todos os produtos</h1>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="space-y-6 p-6 border border-border/80 rounded-xl bg-secondary/20 h-fit">
          {/* Categoria as Select box */}
          <div>
            <Label className="text-xs uppercase tracking-widest font-semibold mb-2 block">Categoria</Label>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-11 bg-background text-xs capitalize">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desconto e Ofertas as Select box */}
          <div>
            <Label className="text-xs uppercase tracking-widest font-semibold mb-2 block">Desconto e Ofertas</Label>
            <Select value={filterDiscount} onValueChange={(v) => setFilterDiscount(v as DiscountFilter)}>
              <SelectTrigger className="h-11 bg-background text-xs">
                <SelectValue placeholder="Filtrar por desconto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os produtos</SelectItem>
                <SelectItem value="com-desconto">Em Oferta / Promoção</SelectItem>
                <SelectItem value="10-ou-mais">10% de desconto ou mais</SelectItem>
                <SelectItem value="20-ou-mais">20% de desconto ou mais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de preço Filter */}
          <div className="pt-2">
            <Label className="text-xs uppercase tracking-widest font-semibold mb-4 block">Faixa de preço</Label>
            <Slider
              min={0}
              max={300}
              step={10}
              minStepsBetweenThumbs={2}
              value={tempRange}
              onValueChange={(v) => setTempRange([v[0], v[1]] as [number, number])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-3 tabular-nums font-medium">
              <span>R$ {tempRange[0]}</span>
              <span>R$ {tempRange[1]}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Input
                type="number"
                min={0}
                max={Math.max(0, tempRange[1] - 20)}
                step={10}
                value={tempRange[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const safeMin = Math.max(0, Math.min(val, tempRange[1] - 20));
                  setTempRange([safeMin, tempRange[1]]);
                }}
                className="h-9 w-20 text-xs bg-background"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <Input
                type="number"
                min={Math.min(300, tempRange[0] + 20)}
                max={300}
                step={10}
                value={tempRange[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const safeMax = Math.min(300, Math.max(val, tempRange[0] + 20));
                  setTempRange([tempRange[0], safeMax]);
                }}
                className="h-9 w-20 text-xs bg-background"
              />
            </div>
            <Button
              className="mt-4 w-full rounded-full uppercase tracking-widest text-[11px]"
              onClick={() => setRange(tempRange)}
            >
              Aplicar faixa de preço
            </Button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground">
              {filtered.length} produto{filtered.length === 1 ? "" : "s"}
            </p>

            {/* Top Sort - without discount option */}
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[180px] rounded-full text-xs">
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
            <div className="py-20 text-center border border-dashed rounded-xl p-8 bg-secondary/10">
              <p className="text-base font-medium text-foreground">Nenhum produto encontrado com estes filtros.</p>
              <Button
                variant="outline"
                className="mt-4 rounded-full text-xs uppercase tracking-widest"
                onClick={() => {
                  setFilterCat("todos");
                  setFilterDiscount("todos");
                  setTempRange([0, 300]);
                  setRange([0, 300]);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}