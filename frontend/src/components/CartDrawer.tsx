import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatBRL } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function CartDrawer() {
  const { isOpen, setOpen, items, subtotal, shipping, total, updateQty, remove, cep, setCep, email, setEmail } = useCart();
  const navigate = useNavigate();
  const cleanCep = cep.replace(/\D/g, "");
  const cepValid = cleanCep.length === 8;

  const handleCheckout = () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Informe um e-mail válido para receber as atualizações.");
      return;
    }
    if (!cepValid) {
      toast.error("Informe um CEP válido para calcular o frete.");
      return;
    }
    setOpen(false);
    navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-5 border-b border-border/60">
          <SheetTitle className="font-display text-2xl font-normal tracking-wide">
            Sua sacola
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" strokeWidth={1} />
            </div>
            <div>
              <p className="font-display text-2xl">Sua sacola está vazia</p>
              <p className="text-muted-foreground text-sm mt-1">Descubra peças cuidadosamente selecionadas.</p>
            </div>
            <Button asChild onClick={() => setOpen(false)} className="rounded-full uppercase tracking-widest text-xs h-11 px-8">
              <Link to="/produtos">Explorar produtos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 animate-fade-in">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-24 object-cover rounded-md bg-muted"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
                      <button
                        onClick={() => remove(product.id)}
                        aria-label="Remover"
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{product.category === "prata" ? "Prata" : "Cosméticos"}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center border border-border rounded-full">
                        <button
                          onClick={() => updateQty(product.id, quantity - 1)}
                          className="p-2 hover:bg-secondary transition-colors rounded-l-full"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-sm tabular-nums">{quantity}</span>
                        <button
                          onClick={() => updateQty(product.id, quantity + 1)}
                          className="p-2 hover:bg-secondary transition-colors rounded-r-full"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">{formatBRL(product.price * quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-secondary/30">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">CEP para entrega</label>
                <div className="flex gap-2">
                  <Input
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="00000-000"
                    inputMode="numeric"
                    className="h-10 rounded-full"
                  />
                  <Button
                    variant="outline"
                    className="h-10 rounded-full text-xs uppercase tracking-widest"
                    onClick={() => {
                      if (cepValid) toast.success("Frete calculado", { description: shipping === 0 ? "Frete grátis!" : formatBRL(shipping) });
                      else toast.error("CEP inválido");
                    }}
                  >
                    Calcular
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">E-mail para contato</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-10 rounded-full"
                />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Frete</span>
                <span className="text-sm tabular-nums">{cepValid ? (shipping === 0 ? "Grátis" : formatBRL(shipping)) : "—"}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-border/60">
                <span className="text-sm">Total</span>
                <span className="font-display text-2xl">{formatBRL(cepValid ? total : subtotal)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full h-12 rounded-full uppercase tracking-widest text-xs">
                Finalizar Compra
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}