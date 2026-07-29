import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatBRL } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag, Store, Truck, Calculator, Check, MapPin } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { calculateMelhorEnvioFreight, type ShippingQuote } from "@/lib/melhorenvio";
import { trackFunnel } from "@/lib/funnel";
import { availableProductQuantityLabel } from "@/lib/products";

export function CartDrawer() {
  const {
    isOpen,
    setOpen,
    items,
    subtotal,
    shipping,
    total,
    updateQty,
    remove,
    add,
    cep,
    setCep,
    phone,
    setPhone,
    shippingOption,
    setShippingOption,
  } = useCart();

  const navigate = useNavigate();
  const cleanCep = cep.replace(/\D/g, "");
  const cepValid = cleanCep.length === 8;

  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  const [calculating, setCalculating] = useState(false);
  const [cityInfo, setCityInfo] = useState<string>("");

  // Melhor Envio Freight calculation with ViaCEP City display
  const handleCalculateFreight = async () => {
    if (!cepValid) {
      toast.error("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setCalculating(true);
    try {
      let locationStr = "";
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`).then((r) => r.json()).catch(() => null);
      if (viaCepRes && !viaCepRes.erro) {
        locationStr = `${viaCepRes.localidade} - ${viaCepRes.uf}`;
        setCityInfo(locationStr);
      }

      const res = await calculateMelhorEnvioFreight({
        toCep: cleanCep,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      });
      setQuotes(res);
      trackFunnel("FREIGHT_CALCULATED", res.length > 0 ? "success" : "empty");
      if (res.length > 0) {
        setSelectedQuoteId(res[0].id);
        toast.success(`Frete calculado para ${locationStr || "o seu endereço"}!`);
      } else {
        toast.error("Não foi possível obter cotações para este CEP.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao consultar a API de fretes.");
    } finally {
      setCalculating(false);
    }
  };

  const handleCheckout = () => {
    if (shippingOption === "entrega" && !cepValid) {
      toast.error("Informe um CEP válido para entrega no endereço.");
      return;
    }
    setOpen(false);
    trackFunnel("CHECKOUT_STARTED", shippingOption);
    navigate({ to: "/checkout" });
  };

  const activeQuote = quotes.find((q) => q.id === selectedQuoteId);
  const effectiveShipping = shippingOption === "retirada" ? 0 : activeQuote ? activeQuote.price : shipping;
  const finalTotal = subtotal + effectiveShipping;
  const freeShippingRemaining = Math.max(0, 250 - subtotal);

  const removeWithUndo = (product: (typeof items)[number]["product"]) => {
    remove(product.id);
    toast("Produto removido da sacola.", {
      action: { label: "Desfazer", onClick: () => add(product) },
    });
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
              {items.map(({ product, quantity }) => {
                const itemPrice = product.discountPrice ?? product.price;
                return (
                  <div key={product.id} className="flex gap-4 animate-fade-in">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-24 object-cover rounded-md bg-muted shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-2">
                        <h3 className="text-sm font-medium leading-tight">{product.name}</h3>
                        <button
                          onClick={() => removeWithUndo(product)}
                          aria-label="Remover"
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {product.category === "prata" ? "Prata 925" : product.category}
                      </p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                        {availableProductQuantityLabel(product)}
                      </p>
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
                        <span className="text-sm font-semibold">{formatBRL(itemPrice * quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-secondary/30">
              {shippingOption === "entrega" && freeShippingRemaining > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Faltam <strong>{formatBRL(freeShippingRemaining)}</strong> para o frete grátis.
                </p>
              )}
              {/* Opção de Envio / Retirada na Loja */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Forma de Envio</label>
                <Tabs value={shippingOption} onValueChange={(v) => setShippingOption(v as typeof shippingOption)}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="entrega" className="text-xs py-1.5 gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> Entrega no Endereço
                    </TabsTrigger>
                    <TabsTrigger value="retirada" className="text-xs py-1.5 gap-1.5">
                      <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Retirar na Loja (Grátis)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {shippingOption === "entrega" ? (
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Calculador de Frete (Melhor Envio)</label>
                  <div className="flex gap-2">
                    <Input
                      value={cep}
                      onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="00000-000"
                      inputMode="numeric"
                      className="h-10 rounded-full text-xs"
                    />
                    <Button
                      variant="outline"
                      disabled={calculating}
                      className="h-10 rounded-full text-xs uppercase tracking-widest shrink-0 gap-1.5"
                      onClick={handleCalculateFreight}
                    >
                      <Calculator className="h-3.5 w-3.5" /> {calculating ? "Cotando..." : "Calcular Frete"}
                    </Button>
                  </div>

                  {cityInfo && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> Frete calculado para <strong>{cityInfo}</strong>
                    </p>
                  )}

                  {/* Lista de Opções do Melhor Envio */}
                  {quotes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {quotes.map((q) => {
                        const isSelected = selectedQuoteId === q.id;
                        return (
                          <div
                            key={q.id}
                            onClick={() => setSelectedQuoteId(q.id)}
                            className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "border-primary bg-primary/10 font-semibold" : "border-border/60 hover:bg-secondary/50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">{q.name}</p>
                                <p className="text-[10px] text-muted-foreground">Entrega em até {q.deliveryTime} dias úteis</p>
                              </div>
                            </div>
                            <span className="text-xs tabular-nums font-bold">
                              {q.price === 0 ? "Grátis" : formatBRL(q.price)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Store className="h-4 w-4" /> Retirada Grátis em Cuiabá/MT
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Retire seu pedido no endereço configurado pela operação, sem custos de frete.
                  </p>
                </div>
              )}



              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Frete</span>
                <span className="text-sm tabular-nums font-semibold">
                  {shippingOption === "retirada" ? "Grátis (Retirar na Loja)" : effectiveShipping === 0 ? "Grátis" : formatBRL(effectiveShipping)}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-border/60">
                <span className="text-sm">Total</span>
                <span className="font-display text-2xl">
                  {formatBRL(finalTotal)}
                </span>
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
