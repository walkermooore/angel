import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useCart, formatBRL } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/store";
import { calculateMelhorEnvioFreight, type ShippingQuote } from "@/lib/melhorenvio";
import { toast } from "sonner";
import { QrCode, CreditCard, FileText, ShieldCheck, MapPin, Mail, Store, Truck, Calculator, Check } from "lucide-react";
import { trackFunnel } from "@/lib/funnel";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Angell" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const {
    items,
    subtotal,
    shipping,
    total,
    cep,
    setCep,
    phone,
    setPhone,
    shippingOption,
    setShippingOption,
    clear,
  } = useCart();

  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [form, setForm] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("PIX");
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState("");
  const reviewRef = useRef<HTMLDivElement>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [calculatingFreight, setCalculatingFreight] = useState(false);
  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId);
  const effectiveShipping = shippingOption === "retirada" ? 0 : selectedQuote?.price ?? 0;

  // When switching to Retirar na Loja, auto fill pickup address
  useEffect(() => {
    trackFunnel("CHECKOUT_STARTED", "page");
  }, []);

  useEffect(() => {
    trackFunnel("SHIPPING_SELECTED", shippingOption);
    if (shippingOption === "retirada") {
      setForm({
        street: "Retirada na loja física",
        number: "500",
        complement: "Centro",
        neighborhood: "Centro",
        city: "Cuiabá",
        state: "MT",
      });
      setCep("78000-000");
    }
  }, [shippingOption, setCep]);

  // Auto fill ViaCEP when CEP reaches 8 digits (for delivery)
  useEffect(() => {
    if (shippingOption !== "entrega") return;
    const clean = (cep || "").replace(/\D/g, "");
    if (clean.length === 8) {
      setLoadingCep(true);
      fetch(`https://viacep.com.br/ws/${clean}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.erro) {
            setForm((prev) => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
            toast.success("Endereço preenchido automaticamente pelo CEP!");
          }
        })
        .catch(() => {
          setFormError("Não foi possível consultar o CEP. Confira o número ou preencha o endereço manualmente.");
        })
        .finally(() => setLoadingCep(false));
    }
  }, [cep, shippingOption]);

  useEffect(() => {
    setQuotes([]);
    setSelectedQuoteId("");
  }, [cep, items, shippingOption]);

  const handleCalculateFreight = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setCalculatingFreight(true);
    try {
      const result = await calculateMelhorEnvioFreight({
        toCep: cleanCep,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      });
      setQuotes(result);
      trackFunnel("FREIGHT_CALCULATED", result.length > 0 ? "success" : "empty");
      setSelectedQuoteId(result[0]?.id || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível calcular o frete.");
    } finally {
      setCalculatingFreight(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (items.length === 0) {
      trackFunnel("FORM_ERROR", "empty_cart");
      setFormError("Sua sacola está vazia.");
      return;
    }
    if (customerName.trim().length < 3) {
      trackFunnel("FORM_ERROR", "customer_name");
      setFormError("Informe seu nome completo.");
      return;
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      trackFunnel("FORM_ERROR", "email");
      setFormError("Informe um e-mail válido.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      trackFunnel("FORM_ERROR", "phone");
      setFormError("Informe um telefone com DDD válido.");
      return;
    }
    if (shippingOption === "entrega" && (!form.street || !form.number || !form.neighborhood || !form.city || !form.state)) {
      trackFunnel("FORM_ERROR", "address");
      setFormError("Preencha o endereço de entrega completo.");
      return;
    }
    if (shippingOption === "entrega" && !selectedQuoteId) {
      trackFunnel("FORM_ERROR", "shipping");
      setFormError("Calcule e selecione uma opção de frete.");
      return;
    }
    if (!reviewing) {
      setReviewing(true);
      setTimeout(() => reviewRef.current?.focus(), 0);
      return;
    }
    if (!acceptedTerms) {
      trackFunnel("FORM_ERROR", "terms");
      setFormError("Confirme que revisou o pedido e aceita as políticas aplicáveis.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        customerName: customerName.trim(),
        email: customerEmail.trim(),
        phone: cleanPhone,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingOption,
        shippingQuoteId: shippingOption === "retirada" ? "PICKUP" : selectedQuoteId as `ME-${number}`,
        payment: payment === "Cartão" ? "CARTAO" : payment === "Boleto" ? "BOLETO" : "PIX",
        address: { cep, ...form },
      }, idempotencyKey);

      clear();
      toast.success("Pedido realizado com sucesso!", { description: `Código: ${order.number}` });
      navigate({
        to: "/pedido-concluido",
        search: { n: order.number, t: order.publicTrackingToken || "" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar o pedido.";
      setFormError(`${message} Seus produtos continuam na sacola. Tente novamente.`);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">Sua sacola está vazia</h1>
        <p className="text-muted-foreground mt-3">Adicione produtos antes de finalizar.</p>
        <Button asChild className="mt-6 rounded-full h-11 px-8 uppercase tracking-widest text-xs">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl mb-10">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-10">
          {formError && (
            <div role="alert" aria-live="assertive" tabIndex={-1} className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {formError}
            </div>
          )}

          {reviewing && (
            <section ref={reviewRef} tabIndex={-1} aria-labelledby="review-title" className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="review-title" className="font-display text-2xl">Revisão final do pedido</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confira tudo antes de registrar o pedido. Você ainda pode corrigir os campos abaixo.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setReviewing(false)}>Editar</Button>
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Contato</dt><dd>{customerName} · {customerEmail} · {phone}</dd></div>
                <div><dt className="text-muted-foreground">Entrega</dt><dd>{shippingOption === "retirada" ? "Retirada na loja" : `${form.street}, ${form.number} — ${form.city}/${form.state}`}</dd></div>
                <div><dt className="text-muted-foreground">Pagamento</dt><dd>{payment}</dd></div>
                <div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{formatBRL(subtotal + effectiveShipping)}</dd></div>
              </dl>
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1"
                />
                <span>Revisei os dados, produtos, valores, entrega e pagamento e concordo com as políticas e termos aplicáveis.</span>
              </label>
            </section>
          )}
          {/* Opção de Envio / Retirar na Loja */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Forma de Envio</h2>
            <Tabs value={shippingOption} onValueChange={(v) => setShippingOption(v as typeof shippingOption)}>
              <TabsList className="grid grid-cols-2 w-full h-12">
                <TabsTrigger value="entrega" className="gap-2 text-sm">
                  <Truck className="h-4 w-4" /> Entrega no Endereço
                </TabsTrigger>
                <TabsTrigger value="retirada" className="gap-2 text-sm">
                  <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Retirar na Loja (Grátis)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {shippingOption === "retirada" && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <Store className="h-4 w-4" /> Retirada Sem Custos de Frete
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seu pedido estará disponível para retirada na loja física: <strong>[endereço de retirada removido]</strong>.
                </p>
              </div>
            )}
          </section>

          {/* Contato do Cliente (Nome, E-mail, Telefone) */}
          <section>
            <h2 className="font-display text-2xl mb-5 flex items-center gap-2">
              <Mail className="h-5 w-5" /> Dados de Contato
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">Seu Nome</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                  className="h-11 mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Seu E-mail</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="h-11 mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Telefone / WhatsApp</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(65) 99999-9999"
                  className="h-11 mt-1.5"
                  required
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Usamos nome, e-mail e telefone somente para identificar o pedido, enviar atualizações e prestar atendimento.
            </p>
          </section>

          {/* Endereço de Entrega */}
          {shippingOption === "entrega" && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Endereço de Entrega
              </h2>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">CEP</Label>
                  <Input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="78000-000"
                    maxLength={9}
                    className="h-11 mt-1.5"
                    required
                  />
                  {loadingCep && <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Buscando CEP...</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-widest">Rua / Logradouro</Label>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Av. Getúlio Vargas"
                    className="h-11 mt-1.5"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">Número</Label>
                  <Input
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="123"
                    className="h-11 mt-1.5"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-widest">Complemento (opcional)</Label>
                  <Input
                    value={form.complement}
                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                    placeholder="Apto, Bloco, etc."
                    className="h-11 mt-1.5"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">Bairro</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Centro"
                    className="h-11 mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest">Cidade</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Cuiabá"
                    className="h-11 mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest">UF</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="MT"
                    maxLength={2}
                    className="h-11 mt-1.5 uppercase"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={calculatingFreight}
                  onClick={handleCalculateFreight}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {calculatingFreight ? "Consultando Melhor Envio..." : "Calcular frete"}
                </Button>
                {quotes.map((quote) => {
                  const selected = quote.id === selectedQuoteId;
                  return (
                    <button
                      type="button"
                      key={quote.id}
                      onClick={() => setSelectedQuoteId(quote.id)}
                      className={`w-full rounded-lg border p-3 text-left flex items-center justify-between ${
                        selected ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${selected ? "bg-primary text-primary-foreground" : ""}`}>
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{quote.company} — {quote.name}</span>
                          <span className="block text-xs text-muted-foreground">Até {quote.deliveryTime} dias úteis</span>
                        </span>
                      </span>
                      <strong className="text-sm">{quote.price === 0 ? "Grátis" : formatBRL(quote.price)}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pagamento */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Forma de Pagamento</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setPayment("PIX"); trackFunnel("PAYMENT_SELECTED", "pix"); }}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  payment === "PIX" ? "border-foreground bg-secondary font-semibold" : "border-border hover:bg-secondary/50"
                }`}
              >
                <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm">PIX</p>
                  <p className="text-[10px] text-muted-foreground">Aprovação instantânea</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setPayment("Cartão"); trackFunnel("PAYMENT_SELECTED", "cartao"); }}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  payment === "Cartão" ? "border-foreground bg-secondary font-semibold" : "border-border hover:bg-secondary/50"
                }`}
              >
                <CreditCard className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <p className="text-sm">Cartão de Crédito</p>
                  <p className="text-[10px] text-muted-foreground">Até 6x sem juros</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setPayment("Boleto"); trackFunnel("PAYMENT_SELECTED", "boleto"); }}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  payment === "Boleto" ? "border-foreground bg-secondary font-semibold" : "border-border hover:bg-secondary/50"
                }`}
              >
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm">Boleto Bancário</p>
                  <p className="text-[10px] text-muted-foreground">Vencimento em 3 dias</p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Resumo do Pedido */}
        <div className="space-y-6">
          <div className="border border-border rounded-2xl p-6 bg-secondary/20 sticky top-24">
            <h2 className="font-display text-2xl mb-6">Resumo</h2>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between text-sm gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium shrink-0">
                    {formatBRL((item.product.discountPrice ?? item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border mt-6 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>{shippingOption === "retirada" ? "Grátis" : selectedQuote ? (effectiveShipping === 0 ? "Grátis" : formatBRL(effectiveShipping)) : "Calcule o frete"}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-3">
                <span>Total</span>
                <span>{formatBRL(subtotal + effectiveShipping)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 rounded-full h-12 text-sm uppercase tracking-widest font-bold"
            >
              {submitting ? "Registrando pedido..." : reviewing ? "Confirmar e Pagar" : "Revisar pedido"}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Compra 100% segura e criptografada
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
