import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts, productsApi } from "@/lib/store";
import { useCategories } from "@/lib/categories";
import { formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Image as ImageIcon, Upload, Percent, Tag } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/admin/produtos")({
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
};

const empty: Draft = {
  name: "",
  price: 0,
  discountPercent: 0,
  discountPrice: 0,
  category: "prata",
  image: "",
  description: "",
  stockQuantity: 0,
  minimumStock: 3,
};

function AdminProducts() {
  const products = useProducts();
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

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
    });
    setOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setDraft((prev) => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
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

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.image || draft.price <= 0) {
      toast.error("Preencha o nome, imagem e um preço válido");
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
      inStock: draft.stockQuantity > 0,
    };

    if (editing) {
      productsApi.update(draft.id!, payload);
      toast.success("Produto atualizado com sucesso!");
    } else {
      productsApi.add(payload);
      toast.success("Produto criado com sucesso!");
    }
    setOpen(false);
  };

  const remove = (p: Product) => {
    if (confirm(`Excluir o produto "${p.name}"?`)) {
      productsApi.remove(p.id);
      toast.success("Produto removido");
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
                  <TableCell className="capitalize">{p.category}</TableCell>
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
