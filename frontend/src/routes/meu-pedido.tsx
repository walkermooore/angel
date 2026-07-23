import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useOrders, type Order } from "@/lib/store";
import { formatBRL } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CheckCircle2, Circle, Package, MapPin, Phone, MessageCircle, AlertCircle, Truck, ExternalLink, Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/meu-pedido")({
  head: () => ({
    meta: [
      { title: "Meu Pedidos — Angel" },
      { name: "description", content: "Acompanhe e rastreie o status do seu pedido na Angel." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ n: (s.n as string) ?? "" }),
  component: MeuPedidoPage,
});

const statusSteps: { key: string; label: string; desc: string }[] = [
  { key: "Pendente", label: "Pedido Recebido", desc: "Aguardando confirmação do pagamento" },
  { key: "Pago", label: "Pagamento Confirmado", desc: "Pagamento aprovado e em preparação" },
  { key: "Enviado", label: "Em Trânsito / Enviado", desc: "Objeto postado e a caminho do endereço" },
  { key: "Concluído", label: "Pedido Entregue", desc: "Entregue no endereço cadastrado" },
];

function MeuPedidoPage() {
  const { n } = Route.useSearch();
  const orders = useOrders();
  const navigate = useNavigate();

  const [searchCode, setSearchCode] = useState(n || "");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (n) {
      setSearchCode(n);
      const match = orders.find((o) => o.number.trim().toLowerCase() === n.trim().toLowerCase());
      setFoundOrder(match || null);
      setSearched(true);
    }
  }, [n, orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchCode.trim();
    if (!clean) return;

    navigate({ to: "/meu-pedido", search: { n: clean } });
    const match = orders.find((o) => o.number.trim().toLowerCase() === clean.toLowerCase());
    setFoundOrder(match || null);
    setSearched(true);
  };

  const getStepIndex = (status: string) => {
    if (status === "Concluído") return 3;
    if (status === "Enviado") return 2;
    if (status === "Pago") return 1;
    return 0; // Pendente
  };

  const currentStep = foundOrder ? getStepIndex(foundOrder.status) : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-10">
      <div className="text-center sm:text-left border-b border-border pb-8">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3">Rastreamento</p>
        <h1 className="font-display text-4xl sm:text-5xl">Acompanhar Meu Pedido</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Digite o código único do seu pedido (ex: <code className="text-foreground font-mono">ANG-20260723-9482</code>) para rastrear o status de entrega em tempo real.
        </p>
      </div>

      {/* Form de Busca de Pedido */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Digite o código do pedido (ANG-...)"
            className="h-12 uppercase font-mono text-sm pl-4"
          />
        </div>
        <Button type="submit" className="rounded-full h-12 px-8 uppercase tracking-widest text-xs gap-2 shrink-0">
          <Search className="h-4 w-4" /> Rastrear
        </Button>
      </form>

      {/* Resultados do Rastreio */}
      {searched && (
        <>
          {foundOrder ? (
            <div className="space-y-8 animate-fade-in">
              {/* Exibe o Código de Rastreio APENAS se o pedido estiver com status 'Enviado' (não concluído) */}
              {foundOrder.trackingCode && foundOrder.status === "Enviado" ? (
                <div className="p-6 border border-blue-500/30 bg-blue-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center sm:justify-start gap-1.5">
                      <Truck className="h-4 w-4" /> Código de Rastreio dos Correios
                    </span>
                    <p className="font-mono font-bold text-2xl text-foreground tracking-wider">{foundOrder.trackingCode}</p>
                    <p className="text-xs text-muted-foreground">Utilize este código para acompanhar a entrega junto aos Correios.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full h-10 px-5 text-xs uppercase tracking-wider"
                      onClick={() => {
                        navigator.clipboard.writeText(foundOrder.trackingCode || "");
                        toast.success("Código de rastreio copiado!");
                      }}
                    >
                      Copiar Código
                    </Button>
                    <Button
                      asChild
                      className="rounded-full h-10 px-5 text-xs uppercase tracking-wider gap-1.5"
                    >
                      <a
                        href={`https://rastreamento.correios.com.br/app/index.php?codigo=${foundOrder.trackingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Rastrear nos Correios <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : foundOrder.shippingOption === "retirada" && foundOrder.status !== "Concluído" ? (
                <div className="p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                      <Store className="h-4 w-4" /> Retirada na Loja Física
                    </span>
                    <p className="font-semibold text-lg text-foreground">[endereço de retirada removido]</p>
                    <p className="text-xs text-muted-foreground">Apresente este código do pedido no balcão de atendimento para retirar.</p>
                  </div>
                </div>
              ) : null}

              {/* Card de Status em Linha do Tempo */}
              <Card className="border-border bg-secondary/10">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Código do Pedido</span>
                      <CardTitle className="font-mono text-2xl text-foreground mt-0.5">{foundOrder.number}</CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Realizado em {new Date(foundOrder.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-4">
                  <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                      {statusSteps.map((step, i) => {
                        const isDone = i <= currentStep;
                        const isCurrent = i === currentStep;
                        return (
                          <div
                            key={step.key}
                            className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                              isCurrent
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : isDone
                                ? "border-border bg-background"
                                : "border-border/40 bg-secondary/30 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                Etapa #{i + 1}
                              </span>
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                                {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes do Pedido e Endereço */}
              <div className="grid sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Endereço / Retirada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">
                      {foundOrder.address.street}, Nº {foundOrder.address.number}
                      {foundOrder.address.complement ? ` (${foundOrder.address.complement})` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {foundOrder.address.neighborhood} — {foundOrder.address.city}/{foundOrder.address.state}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">CEP: {foundOrder.address.cep}</p>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5 pt-2 border-t border-border/60">
                      <Phone className="h-3.5 w-3.5" /> Contato: {foundOrder.email}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" /> Resumo do Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pagamento</span>
                      <span className="font-medium">{foundOrder.payment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">{formatBRL(foundOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="tabular-nums font-semibold">
                        {foundOrder.shippingOption === "retirada" ? "Grátis (Retirada)" : foundOrder.shipping === 0 ? "Grátis" : formatBRL(foundOrder.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border/60 font-bold text-base">
                      <span>Total</span>
                      <span className="tabular-nums text-foreground">{formatBRL(foundOrder.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Botão de Suporte via WhatsApp */}
              <div className="p-6 border border-emerald-500/20 rounded-xl bg-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground text-base">Dúvidas sobre o rastreamento?</h3>
                  <p className="text-xs text-muted-foreground mt-1">Fale diretamente com nossa equipe de suporte no WhatsApp.</p>
                </div>
                <Button
                  asChild
                  className="rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs uppercase tracking-wider px-6 h-11 shrink-0 gap-2"
                >
                  <a
                    href={`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp ([contato removido])
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed rounded-xl bg-secondary/10 text-center space-y-4 max-w-xl mx-auto">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto opacity-80" />
              <div>
                <h3 className="font-display text-2xl text-foreground">Pedido não encontrado</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Não localizamos nenhum pedido com o código <strong className="font-mono text-foreground">{searchCode}</strong>.
                  Verifique o código digitado ou fale conosco no atendimento.
                </p>
              </div>
              <Button
                asChild
                className="rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs uppercase tracking-wider px-6 h-11 gap-2"
              >
                <a
                  href={`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Suporte WhatsApp ([contato removido])
                </a>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
