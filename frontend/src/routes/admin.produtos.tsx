import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { mapProductFromBackend, setProductsFromBackend, useProducts, productsApi } from "@/lib/store";
import { mapCategoriesFromBackend, setCategoriesFromBackend, useCategories } from "@/lib/categories";
import { formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Pencil, Trash2, Plus, Image as ImageIcon, Upload, Percent, Tag } from "lucide-react";
import { toast } from "sonner";
import { hasProductShippingDimensions, type Product } from "@/lib/products";
import { getCategoriesFromBackend, getProductsFromBackend, uploadImage } from "@/lib/api";

export const Route = createFileRoute("/admin/produtos")({
  loader: async () => {
    const [products, categories] = await Promise.all([getProductsFromBackend(), getCategoriesFromBackend()]);
    return {
      products: Array.isArray(products) ? products.map(mapProductFromBackend) : [],
      categories: Array.isArray(categories) ? mapCategoriesFromBackend(categories) : [],
    };
  },
  component: AdminProducts,
});

type Draft = {
  id?: string;
  name: string;
  price: number;
  discountPercent?: number;
  discountPrice?: number;
  category: string;
  image: string;
  description: string;
  stockQuantity: number;
  minimumStock: number;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
};

const empty: Draft = {
  name: "",
  price: 0,
  discountPercent: 0,
  discountPrice: 0,
  category: "prata",
  image: "",
  description: "",
  stockQuantity: 100,
  minimumStock: 3,
  weight: undefined,
  height: undefined,
  width: undefined,
  length: undefined,
};

function AdminProducts() {
  const loaded = Route.useLoaderData();
  const liveProducts = useProducts();
  const liveCategories = useCategories();
  const [hydrated, setHydrated] = useState(false);
  const products = hydrated ? liveProducts : loaded.products;
  const categories = hydrated ? liveCategories : loaded.categories;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

  useEffect(() => {
    setProductsFromBackend(loaded.products);
    setCategoriesFromBackend(loaded.categories);
    setHydrated(true);
  }, [loaded.products, loaded.categories]);

  const editing = Boolean(draft.id);

  const startNew = () => {
    setDraft({ ...empty, category: categories[0] || "prata" });
    setOpen(true);
  };

  const startEdit = (p: Product) => {
    setDraft({
      id: p.id,
      name: p.name,
      price: p.price,
      discountPercent: p.discountPercent || 0,
      discountPrice: p.discountPrice || p.price,
      category: p.category,
      image: p.image,
      description: p.description,
      stockQuantity: p.stockQuantity ?? 0,
      minimumStock: p.minimumStock ?? 3,
      weight: p.weight,
      height: p.height,
      width: p.width,
      length: p.length,
    });
    setOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Use uma imagem JPEG, PNG ou WebP.");
        e.target.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2 MB.");
        e.target.value = "";
        return;
      }
      try {
        const uploaded = await uploadImage(file);
        setDraft((prev) => ({ ...prev, image: uploaded.url }));
        toast.success("Imagem enviada com sucesso.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
      } finally {
        e.target.value = "";
      }
    }
  };

  const handlePriceOrDiscountChange = (newPrice: number, newDiscountPercent: number) => {
    const percent = Math.min(100, Math.max(0, newDiscountPercent));
    const calculatedDiscountPrice = percent > 0 ? Number((newPrice * (1 - percent / 100)).toFixed(2)) : newPrice;

    setDraft((prev) => ({
      ...prev,
      price: newPrice,
      discountPercent: percent,
      discountPrice: calculatedDiscountPrice,
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.image || draft.price <= 0) {
      toast.error("Preencha o nome, imagem e um preço válido.");
      return;
    }
    if (!draft.weight || !draft.height || !draft.width || !draft.length) {
      toast.error("Informe o peso e todas as dimensões do produto.");
      return;
    }

    const payload: Product = {
      id: draft.id || crypto.randomUUID(),
      name: draft.name,
      price: draft.price,
      discountPercent: draft.discountPercent || 0,
      discountPrice: (draft.discountPercent && draft.discountPercent > 0)
        ? Number((draft.price * (1 - draft.discountPercent / 100)).toFixed(2))
        : draft.price,
      category: draft.category,
      image: draft.image,
      description: draft.description,
      stockQuantity: draft.stockQuantity,
      reservedQuantity: editing ? products.find((p) => p.id === draft.id)?.reservedQuantity ?? 0 : 0,
      soldQuantity: editing ? products.find((p) => p.id === draft.id)?.soldQuantity ?? 0 : 0,
      minimumStock: draft.minimumStock,
      weight: draft.weight,
      height: draft.height,
      width: draft.width,
      length: draft.length,
    };

    try {
      if (editing) {
        await productsApi.update(draft.id!, payload);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await productsApi.add(payload);
        toast.success("Produto criado com sucesso!");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    }
  };

  const remove = async (p: Product) => {
    if (confirm(`Excluir o produto "${p.name}"?`)) {
      try {
        await productsApi.remove(p.id);
        toast.success("Produto removido");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível excluir o produto.");
      }
    }
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie o catálogo de produtos e promoções.</p>
        </div>
        <Button onClick={startNew} className="rounded-full h-11 px-6 uppercase tracking-widest text-xs gap-2">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço Original</TableHead>
              <TableHead className="text-right">Desconto</TableHead>
              <TableHead className="text-right">Preço Final</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const hasDiscount = Boolean(p.discountPercent && p.discountPercent > 0);
              const finalPrice = p.discountPrice ?? p.price;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {hasDiscount && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Tag className="h-3 w-3" /> {p.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{p.category}</span>
                    {!hasProductShippingDimensions(p) && (
                      <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Frete não configurado
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={hasDiscount ? "line-through text-muted-foreground text-xs" : ""}>
                      {formatBRL(p.price)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {hasDiscount ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        -{p.discountPercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-foreground">
                    {formatBRL(finalPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={(p.stockQuantity ?? 0) - (p.reservedQuantity ?? 0) <= (p.minimumStock ?? 3) ? "text-destructive font-semibold" : ""}>
                      {(p.stockQuantity ?? 0) - (p.reservedQuantity ?? 0)} disponível
                      {(p.reservedQuantity ?? 0) > 0 ? ` (${p.reservedQuantity} reservado)` : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Editar produto">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(p)}
                        title="Excluir produto"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Product Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">
              {editing ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-5 mt-2">
            <div>
              <Label className="text-xs uppercase tracking-widest">Nome do Produto</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex: Colar Éclat Prata 925"
                className="h-11 mt-1.5"
                required
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest">Estoque mínimo para alerta</Label>
              <Input
                type="number"
                min="0"
                max="999999"
                value={draft.minimumStock}
                onChange={(e) => setDraft({ ...draft, minimumStock: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-11 mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">Categoria</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger className="h-11 mt-1.5 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest">Preço Original (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price || ""}
                  onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                  onChange={(e) => handlePriceOrDiscountChange(parseFloat(e.target.value) || 0, draft.discountPercent || 0)}
                  placeholder="0,00"
                  className="h-11 mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest">Quantidade em estoque</Label>
              <Input
                type="number"
                min="0"
                max="999999"
                value={draft.stockQuantity}
                onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => setDraft({ ...draft, stockQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-11 mt-1.5"
                required
              />
            </div>

            <div className="p-4 border rounded-lg bg-secondary/20 space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-widest font-semibold">Dados para cálculo do frete</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Informe o produto já embalado. Peso em quilogramas e dimensões em centímetros.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px]">Peso (kg)</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={draft.weight ?? ""}
                    onChange={(e) => setDraft({ ...draft, weight: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0,100"
                    className="h-11 mt-1.5 bg-background"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Altura (cm)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.height ?? ""}
                    onChange={(e) => setDraft({ ...draft, height: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="4"
                    className="h-11 mt-1.5 bg-background"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Largura (cm)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.width ?? ""}
                    onChange={(e) => setDraft({ ...draft, width: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="12"
                    className="h-11 mt-1.5 bg-background"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Comprimento (cm)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.length ?? ""}
                    onChange={(e) => setDraft({ ...draft, length: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="16"
                    className="h-11 mt-1.5 bg-background"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Discount Section with Auto-calculation */}
            <div className="p-4 border rounded-lg bg-secondary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  <Label className="text-xs uppercase tracking-widest font-semibold">Desconto (%)</Label>
                </div>
                {Boolean(draft.discountPercent && draft.discountPercent > 0) && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {draft.discountPercent}% OFF Aplicado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Input
                    type="number"
                    min="0"
                    onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    value={draft.discountPercent || ""}
                    onChange={(e) => handlePriceOrDiscountChange(draft.price, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-11 bg-background"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Preço Final Calculado:</span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {formatBRL(draft.discountPrice ?? draft.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Image Picker Section with Live Preview */}
            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Imagem do Produto</Label>
              {draft.image ? (
                <div className="relative group border border-border rounded-lg p-2 bg-background flex items-center gap-4">
                  <img src={draft.image} alt="Preview" className="h-20 w-20 object-cover rounded-md bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4" /> Imagem selecionada
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">Pronta para o catálogo</p>
                    <label className="inline-flex items-center gap-1 text-xs text-primary underline cursor-pointer mt-2 hover:text-primary/80">
                      <Upload className="h-3.5 w-3.5" /> Trocar imagem
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraft((prev) => ({ ...prev, image: "" }))}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors bg-secondary/10">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Clique para selecionar uma imagem</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required={!editing} />
                </label>
              )}
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest">Descrição</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Detalhes e acabamento do produto..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full uppercase tracking-widest text-xs px-6">
                Salvar Produto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
