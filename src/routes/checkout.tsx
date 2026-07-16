import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatBRL } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/store";
import { toast } from "sonner";
import { QrCode, CreditCard, FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Angel" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, shipping, total, cep, email, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("PIX");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Sacola vazia"); return; }
    if (!email) { toast.error("E-mail obrigatório"); return; }
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      toast.error("Preencha o endereço completo");
      return;
    }
    const order = ordersApi.create({
      email,
      items: items.map((i) => ({
        productId: i.product.id, name: i.product.name, price: i.product.price,
        quantity: i.quantity, image: i.product.image,
      })),
      subtotal, shipping, total,
      payment,
      address: { cep, ...form },
    });
    clear();
    toast.success("Pedido finalizado!", { description: order.number });
    navigate({ to: "/pedido-concluido", search: { n: order.number } });
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
          <section>
            <h2 className="font-display text-2xl mb-5">Contato</h2>
            <div className="grid gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">E-mail</Label>
                <Input value={email} disabled className="h-11 mt-1.5" />
                <p className="text-xs text-muted-foreground mt-2">Enviaremos atualizações do pedido para este e-mail.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl mb-5">Endereço de entrega</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-widest">CEP</Label>
                <Input value={cep} disabled className="h-11 mt-1.5" />
              </div>
              <div className="sm:col-span-2 grid grid-cols-[1fr_140px] gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest">Rua</Label>
                  <Input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="h-11 mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest">Número</Label>
                  <Input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="h-11 mt-1.5" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Complemento</Label>
                <Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="h-11 mt-1.5" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Bairro</Label>
                <Input required value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="h-11 mt-1.5" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Cidade</Label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 mt-1.5" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest">Estado</Label>
                <Input required maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className="h-11 mt-1.5" placeholder="SP" />
              </div>
            </div>
          </section>

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
                <p className="text-sm">O boleto será gerado após a confirmação e enviado para <strong>{email}</strong>.</p>
                <p className="text-xs text-muted-foreground mt-2">Vencimento em 3 dias úteis.</p>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit border border-border rounded-lg p-6 bg-secondary/20 space-y-4">
          <h3 className="font-display text-xl">Resumo do pedido</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 items-center">
                <img src={product.image} alt="" className="w-12 h-14 object-cover rounded bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {quantity}</p>
                </div>
                <span className="text-sm tabular-nums">{formatBRL(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-border/60 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">{shipping === 0 ? "Grátis" : formatBRL(shipping)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border/60"><span>Total</span><span className="font-display text-xl">{formatBRL(total)}</span></div>
          </div>
          <Button type="submit" className="w-full h-12 rounded-full uppercase tracking-widest text-xs">
            Concluir pedido
          </Button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <ShieldCheck className="h-3.5 w-3.5" /> Compra segura · dados protegidos
          </p>
        </aside>
      </form>
    </div>
  );
}
