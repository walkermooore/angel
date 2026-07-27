import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";
import { useCart, formatBRL } from "@/lib/cart";
import { Check } from "lucide-react";

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { add } = useCart();
  if (!product) return null;

  const effectivePrice = product.discountPrice ?? product.price;
  const hasDiscount = Boolean(product.discountPercent && product.discountPercent > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto bg-secondary/40">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-foreground text-background shadow">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>
          <div className="p-8 flex flex-col">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {product.category === "prata" ? "Prata 925" : product.category}
            </p>
            <h2 className="font-display text-3xl mt-2">{product.name}</h2>

            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-medium tabular-nums">{formatBRL(effectivePrice)}</p>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through tabular-nums">
                  {formatBRL(product.price)}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-6 leading-relaxed">{product.description}</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" /> Frete grátis acima de R$ 250
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" /> Garantia de 30 dias
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" /> Embalagem presente Angell
              </li>
            </ul>
            <Button
              onClick={() => {
                add({ ...product, price: effectivePrice });
                onOpenChange(false);
              }}
              className="mt-8 h-12 rounded-full uppercase tracking-widest text-xs"
            >
              Adicionar à sacola
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
