import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart, formatBRL } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/store";
import { toast } from "sonner";
import { QrCode, CreditCard, FileText, ShieldCheck, MapPin, Phone, MessageCircle, Store, Truck } from "lucide-react";

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
      email: phone,
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

    const itemsList = items
      .map((i) => `- ${i.product.name} (x${i.quantity}) — ${formatBRL((i.product.discountPrice ?? i.product.price) * i.quantity)}`)
      .join("\n");

    const envText = shippingOption === "retirada"
      ? `🏬 *Modo:* Retirada na Loja Física (Grátis)\n📍 Endereço da Loja: [endereço de retirada removido]`
      : `🚚 *Modo:* Entrega no Endereço\n📍 Endereço: ${form.street}, Nº ${form.number}${form.complement ? " (" + form.complement + ")" : ""}\n${form.neighborhood} - ${form.city}/${form.state} (CEP: ${cep})`;

    const message = `Olá! Acabei de fazer um pedido na Angel 💖\n\n` +
      `📦 *Código do Pedido:* ${order.number}\n` +
      `👤 *Cliente:* ${customerName || "Cliente"} (${phone})\n` +
      `💵 *Valor Total:* ${formatBRL(finalTotal)}\n` +
      `💳 *Forma de Pagamento:* ${payment}\n\n` +
      `${envText}\n\n` +
      `🛒 *Itens:*\n${itemsList}`;

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

          {/* Contato pelo Telefone */}
          <section>
            <h2 className="font-display text-2xl mb-5 flex items-center gap-2">
              <Phone className="h-5 w-5" /> Contato
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
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

          {/* Endereço de entrega / Retirada */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <MapPin className="h-5 w-5" /> {shippingOption === "retirada" ? "Local de Retirada" : "Endereço de entrega"}
              </h2>
              {loadingCep && <span className="text-xs text-muted-foreground animate-pulse">Buscando CEP...</span>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">CEP</Label>
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="00000-000"
                  className="h-11 mt-1.5"
                  required
                  disabled={shippingOption === "retirada"}
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-[1fr_120px] gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">Rua / Logradouro</Label>
                  <Input
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Rua, Avenida..."
                    className="h-11 mt-1.5"
                    disabled={shippingOption === "retirada"}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest">Número</Label>
                  <Input
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="123"
                    className="h-11 mt-1.5"
                    disabled={shippingOption === "retirada"}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Complemento</Label>
                <Input
                  value={form.complement}
                  onChange={(e) => setForm({ ...form, complement: e.target.value })}
                  placeholder="Apto, Bloco..."
                  className="h-11 mt-1.5"
                  disabled={shippingOption === "retirada"}
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest">Bairro</Label>
                <Input
                  required
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                  className="h-11 mt-1.5"
                  disabled={shippingOption === "retirada"}
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest">Cidade</Label>
                <Input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-11 mt-1.5"
                  disabled={shippingOption === "retirada"}
                />
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest">Estado (UF)</Label>
                <Input
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                  placeholder="MT"
                  className="h-11 mt-1.5"
                  disabled={shippingOption === "retirada"}
                />
              </div>
            </div>
          </section>

          {/* Pagamento */}
          <section>
            <h2 className="font-display text-2xl mb-5">Pagamento</h2>
            <Tabs value={payment} onValueChange={(v) => setPayment(v as typeof payment)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="PIX"><QrCode className="h-4 w-4 mr-2" />PIX</TabsTrigger>
                <TabsTrigger value="Cartão"><CreditCard className="h-4 w-4 mr-2" />Cartão</TabsTrigger>
                <TabsTrigger value="Boleto"><FileText className="h-4 w-4 mr-2" />Boleto</TabsTrigger>
              </TabsList>
              <TabsContent value="PIX" className="mt-6 p-6 border border-border rounded-lg text-center">
                <div className="mx-auto w-40 h-40 bg-[repeating-conic-gradient(#111_0_25%,#fff_0_50%)] bg-[length:12px_12px] rounded-md" aria-label="QR Code" />
                <p className="mt-4 text-sm text-muted-foreground">Escaneie o QR Code no app do seu banco.</p>
                <p className="text-xs text-muted-foreground mt-1">Pagamento aprovado instantaneamente.</p>
              </TabsContent>
              <TabsContent value="Cartão" className="mt-6 grid gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">Número do cartão</Label>
                  <Input placeholder="0000 0000 0000 0000" className="h-11 mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest">Nome impresso</Label>
                  <Input placeholder="COMO NO CARTÃO" className="h-11 mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-widest">Validade</Label>
                    <Input placeholder="MM/AA" className="h-11 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest">CVV</Label>
                    <Input placeholder="000" className="h-11 mt-1.5" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="Boleto" className="mt-6 p-6 border border-border rounded-lg">
                <p className="text-sm">O boleto será gerado e enviado para confirmação via WhatsApp.</p>
                <p className="text-xs text-muted-foreground mt-2">Vencimento em 3 dias úteis.</p>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit border border-border rounded-lg p-6 bg-secondary/20 space-y-4">
          <h3 className="font-display text-xl">Resumo do pedido</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map(({ product, quantity }) => {
              const itemPrice = product.discountPrice ?? product.price;
              return (
                <div key={product.id} className="flex gap-3 items-center">
                  <img src={product.image} alt="" className="w-12 h-14 object-cover rounded bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Qtd: {quantity}</p>
                  </div>
                  <span className="text-sm tabular-nums font-semibold">{formatBRL(itemPrice * quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t border-border/60 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Frete</span>
              <span className="tabular-nums">
                {shippingOption === "retirada" ? "Grátis (Retirada)" : shipping === 0 ? "Grátis" : formatBRL(shipping)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/60"><span>Total</span><span className="font-display text-xl">{formatBRL(shippingOption === "retirada" ? subtotal : total)}</span></div>
          </div>
          <Button type="submit" className="w-full h-12 rounded-full uppercase tracking-widest text-xs gap-2">
            <MessageCircle className="h-4 w-4" /> Finalizar & Enviar WhatsApp
          </Button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground justify-center text-center">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Atendimento direto no [contato removido]
          </p>
        </aside>
      </form>
    </div>
  );
}
