import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts, productsApi } from "@/lib/store";
import { formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

type Draft = { id?: string; name: string; price: number; category: Product["category"]; image: string; description: string };
const empty: Draft = { name: "", price: 0, category: "prata", image: "", description: "" };

function AdminProducts() {
  const products = useProducts();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

  const editing = Boolean(draft.id);
  const startNew = () => { setDraft(empty); setOpen(true); };
  const startEdit = (p: Product) => { setDraft(p); setOpen(true); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.image || draft.price <= 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (editing) {
      productsApi.update(draft.id!, draft);
      toast.success("Produto atualizado");
    } else {
      productsApi.add(draft);
      toast.success("Produto criado");
    }
    setOpen(false);
  };

  const remove = (p: Product) => {
    if (confirm(`Excluir "${p.name}"?`)) {
      productsApi.remove(p.id);
      toast.success("Produto removido");
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl sm:text-4xl">Produtos</h1>
        <Button onClick={startNew} className="rounded-full h-11 px-6 uppercase tracking-widest text-xs">
          <Plus className="h-4 w-4 mr-2" /> Novo produto
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-10 w-10 rounded object-cover bg-muted" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{p.category === "prata" ? "Prata" : "Cosméticos"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatBRL(p.price)}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">
              {editing ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Nome</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-11 mt-1.5" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">Preço (R$)</Label>
                <Input type="number" step="0.01" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })} className="h-11 mt-1.5" required />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Categoria</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as Product["category"] })}>
                  <SelectTrigger className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prata">Prata</SelectItem>
                    <SelectItem value="cosmeticos">Cosméticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">URL da imagem</Label>
              <Input value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} className="h-11 mt-1.5" placeholder="https://..." required />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Descrição</Label>
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1.5" rows={3} />
            </div>
            <Button type="submit" className="w-full h-11 rounded-full uppercase tracking-widest text-xs">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
