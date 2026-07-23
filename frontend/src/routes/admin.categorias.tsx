import { createFileRoute } from "@tanstack/react-router";
import { useCategories, categoriesApi } from "@/lib/categories";
import { useProducts, productsApi } from "@/lib/store";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/cart";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

function AdminCategories() {
  const categories = useCategories();
  const products = useProducts();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [blockedCat, setBlockedCat] = useState<string | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Preencha o nome da categoria.");
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Esta categoria já existe.");
      return;
    }
    categoriesApi.add(trimmed);
    toast.success("Nova categoria criada com sucesso!");
    setNewCatName("");
    setOpenAddModal(false);
  };

  const startEdit = (cat: string) => {
    setEditingCategory(cat);
    setEditValue(cat);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("O nome da categoria não pode ser vazio.");
      return;
    }
    if (trimmed.toLowerCase() !== editingCategory.toLowerCase() && categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Esta categoria já existe.");
      return;
    }

    categoriesApi.update(editingCategory, trimmed);

    const linked = products.filter((p) => p.category.toLowerCase() === editingCategory.toLowerCase());
    linked.forEach((p) => {
      productsApi.update(p.id, { category: trimmed });
    });

    toast.success("Categoria atualizada.");
    setEditingCategory(null);
  };

  const handleRemoveClick = (cat: string) => {
    const linkedProducts = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase());
    if (linkedProducts.length > 0) {
      setBlockedCat(cat);
      return;
    }

    if (confirm(`Excluir a categoria "${cat}"?`)) {
      categoriesApi.remove(cat);
      toast.success("Categoria removida.");
    }
  };

  const linkedProductsForBlocked = blockedCat
    ? products.filter((p) => p.category.toLowerCase() === blockedCat.toLowerCase())
    : [];

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as categorias de produtos da loja.</p>
        </div>

        {/* Único botão para abrir o popup de nova categoria */}
        <Button onClick={() => setOpenAddModal(true)} className="rounded-full h-11 px-6 uppercase tracking-widest text-xs gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Adicionar nova categoria
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Categoria</TableHead>
              <TableHead className="text-center">Produtos Vinculados</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <TableRow key={cat}>
                  <TableCell className="font-medium capitalize">{cat}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                      {count} produto{count === 1 ? "" : "s"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(cat)} title="Editar categoria">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(cat)}
                        title="Remover categoria"
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

      {/* Modal Popup para Criar Nova Categoria */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Adicionar Nova Categoria</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Digite o nome da nova categoria de produtos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCategory} className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Nome da Categoria</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: Anéis, Pulseiras, Perfumes..."
                className="h-11 capitalize text-sm"
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAddModal(false)} className="rounded-full text-xs uppercase tracking-widest">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full text-xs uppercase tracking-widest">
                Criar Categoria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={Boolean(editingCategory)} onOpenChange={(o) => !o && setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 mt-2">
            <div>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Nome da categoria"
                className="h-11 capitalize"
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-full uppercase tracking-widest text-xs">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blocked Deletion Dialog */}
      <Dialog open={Boolean(blockedCat)} onOpenChange={(o) => !o && setBlockedCat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-1">
              <AlertTriangle className="h-6 w-6" />
              <DialogTitle className="font-display text-2xl text-foreground">Não é possível excluir</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              A categoria <strong className="text-foreground capitalize">"{blockedCat}"</strong> não pode ser excluída pois existem{" "}
              <strong>{linkedProductsForBlocked.length}</strong> produto{linkedProductsForBlocked.length === 1 ? "" : "s"} vinculado{linkedProductsForBlocked.length === 1 ? "" : "s"} a ela:
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 max-h-60 overflow-y-auto space-y-2.5 pr-1 border rounded-lg p-3 bg-secondary/20">
            {linkedProductsForBlocked.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm p-2 rounded bg-background border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.image} alt="" className="h-10 w-10 rounded object-cover bg-muted shrink-0" />
                  <span className="font-medium truncate">{p.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums shrink-0 font-medium">{formatBRL(p.price)}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setBlockedCat(null)} className="w-full rounded-full uppercase tracking-widest text-xs">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
