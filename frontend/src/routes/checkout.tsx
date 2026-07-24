import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart, formatBRL } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/store";
import { toast } from "sonner";
import { QrCode, CreditCard, FileText, ShieldCheck, MapPin, Phone, Mail, Store, Truck } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Angel" }, { name: "robots", content: "noindex" }] }),
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

  // When switching to Retirar na Loja, auto fill pickup address
  useEffect(() => {
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
        .catch(() => {})
        .finally(() => setLoadingCep(false));
    }
  }, [cep, shippingOption]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Sua sacola está vazia.");
      return;
    }
    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Informe um telefone com DDD válido.");
      return;
    }
    if (shippingOption === "entrega" && (!form.street || !form.number || !form.neighborhood || !form.city || !form.state)) {
      toast.error("Preencha o endereço de entrega completo.");
      return;
    }

    const finalShipping = shippingOption === "retirada" ? 0 : shipping;
    const finalTotal = subtotal + finalShipping;

    const order = ordersApi.create({
      email: customerEmail.trim(),
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.discountPrice ?? i.product.price,
        quantity: i.quantity,
        image: i.product.image,
      })),
      subtotal,
      shipping: finalShipping,
      total: finalTotal,
      shippingOption,
      payment,
      address: { cep, ...form },
    });

    clear();
    toast.success("Pedido realizado com sucesso!", { description: `Código: ${order.number}` });

    navigate({
      to: "/pedido-concluido",
      search: { n: order.number },
    });
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
            </section>
          )}

          {/* Pagamento */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Forma de Pagamento</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPayment("PIX")}
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
                onClick={() => setPayment("Cartão")}
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
                onClick={() => setPayment("Boleto")}
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
                <span>{shippingOption === "retirada" ? "Grátis" : shipping === 0 ? "Grátis" : formatBRL(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-3">
                <span>Total</span>
                <span>{formatBRL(subtotal + (shippingOption === "retirada" ? 0 : shipping))}</span>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 rounded-full h-12 text-sm uppercase tracking-widest font-bold">
              Confirmar e Pagar
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
