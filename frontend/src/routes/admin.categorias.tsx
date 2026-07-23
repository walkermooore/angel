import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { categoriesApi, useCategories, useProducts } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCategoryLabel, normalizeCategory } from "@/lib/products";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategorias,
});

function AdminCategorias() {
  const categories = useCategories();
  const products = useProducts();
  const [name, setName] = useState("");

  const counts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category] = products.filter((p) => normalizeCategory(p.category) === category).length;
      return acc;
    }, {});
  }, [categories, products]);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = categoriesApi.add(name);
    if (!ok) {
      toast.error("Categoria inválida ou já existente");
      return;
    }
    toast.success("Categoria criada");
    setName("");
  };

  const onRemove = (category: string) => {
    const ok = categoriesApi.remove(category);
    if (!ok) {
      toast.error("Não foi possível remover (categoria padrão ou em uso)");
      return;
    }
    toast.success("Categoria removida");
  };

  return (
    <div className="w-full p-6 sm:p-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Categorias</h1>

      <form onSubmit={onCreate} className="mb-8 flex gap-3 max-w-xl">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
          placeholder="Ex.: Maquiagem Premium"
          required
        />
        <Button type="submit" className="h-11 rounded-full uppercase tracking-widest text-xs px-6">
          <Plus className="h-4 w-4 mr-2" /> Criar categoria
        </Button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category} className="rounded-lg border border-border/60 bg-background px-4 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{formatCategoryLabel(category)}</p>
              <p className="text-xs text-muted-foreground mt-1">{counts[category] ?? 0} produto(s)</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemove(category)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
