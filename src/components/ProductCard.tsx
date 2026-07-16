import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { useState } from "react";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    add(product);
    toast.success("Produto adicionado", { description: product.name });
  };
  return (
    <div className="group flex flex-col">
      <button
        onClick={() => setOpen(true)}
        className="relative overflow-hidden rounded-lg bg-secondary/40 aspect-[4/5] text-left"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            onClick={handleAdd}
            className="w-full h-11 rounded-full uppercase tracking-widest text-[11px] bg-background text-foreground hover:bg-foreground hover:text-background"
          >
            Adicionar
          </Button>
        </div>
      </button>
      <button onClick={() => setOpen(true)} className="mt-4 flex items-baseline justify-between gap-3 text-left">
        <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">{formatBRL(product.price)}</span>
      </button>
      <p className="text-xs text-muted-foreground mt-1 capitalize">
        {product.category === "prata" ? "Prata 925" : "Cosméticos"}
      </p>
      <Button
        onClick={handleAdd}
        variant="outline"
        className="sm:hidden mt-3 rounded-full uppercase tracking-widest text-[11px]"
      >
        Adicionar ao carrinho
      </Button>
      <ProductDetailDialog product={product} open={open} onOpenChange={setOpen} />
    </div>
  );
}