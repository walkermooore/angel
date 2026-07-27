import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useProducts } from "@/lib/store";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { formatBRL } from "@/lib/cart";
import { isProductAvailable } from "@/lib/products";
import { productSlug } from "@/lib/seo";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const products = useProducts().filter(isProductAvailable);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 6);
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)).slice(0, 8);
  }, [q, products]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por joias, cosméticos..."
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-base"
          />
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nada encontrado.</li>
          )}
          {results.map((p) => (
            <li key={p.id}>
              <Link
                to="/produtos/$slug"
                params={{ slug: productSlug(p) }}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/60 transition-colors"
              >
                <img src={p.image} alt="" className="h-12 w-12 rounded object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.category === "prata" ? "Prata 925" : "Cosméticos"}</p>
                </div>
                <span className="text-sm tabular-nums">{formatBRL(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
