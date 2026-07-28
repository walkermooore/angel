import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/lib/cart";
import { availableProductQuantityLabel, type Product } from "@/lib/products";
import { Link } from "@tanstack/react-router";
import { productSlug } from "@/lib/seo";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const effectivePrice = product.discountPrice ?? product.price;
  const hasDiscount = Boolean(product.discountPercent && product.discountPercent > 0);

  const handleAdd = () => {
    add({ ...product, price: effectivePrice });
  };

  return (
    <div className="group flex flex-col h-full min-w-0">
      <div className="relative overflow-hidden rounded-lg bg-secondary/40 aspect-square w-full shrink-0">
        <Link
          to="/produtos/$slug"
          params={{ slug: productSlug(product) }}
          className="absolute inset-0 text-left cursor-pointer"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="eager"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
              Imagem indisponível
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-foreground text-background shadow">
              {product.discountPercent}% OFF
            </span>
          )}
        </Link>
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            onClick={handleAdd}
            className="w-full h-11 rounded-full uppercase tracking-widest text-[11px] bg-background text-foreground hover:bg-foreground hover:text-background"
          >
            Adicionar
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col flex-1 justify-between gap-1">
        <div>
          <Link
            to="/produtos/$slug"
            params={{ slug: productSlug(product) }}
            className="flex items-baseline justify-between gap-2 text-left w-full cursor-pointer"
          >
            <h3 className="text-sm font-medium leading-tight line-clamp-2 hover:underline">{product.name}</h3>
            <div className="flex flex-col items-end shrink-0 tabular-nums">
              {hasDiscount && (
                <span className="text-[11px] text-muted-foreground line-through">{formatBRL(product.price)}</span>
              )}
              <span className="text-sm text-foreground font-semibold">{formatBRL(effectivePrice)}</span>
            </div>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            {product.category === "prata" ? "Prata 925" : product.category}
          </p>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {availableProductQuantityLabel(product)}
          </p>
        </div>
        <Button
          onClick={handleAdd}
          variant="outline"
          className="sm:hidden mt-3 rounded-full uppercase tracking-widest text-[11px] w-full"
        >
          Adicionar ao carrinho
        </Button>
      </div>
    </div>
  );
}
