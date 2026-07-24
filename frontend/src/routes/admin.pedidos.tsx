import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useOrders, ordersApi, type Order, type OrderStatus } from "@/lib/store";
import { formatBRL } from "@/lib/cart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShoppingBag, MapPin, Phone, CreditCard, Clock, Truck, Save, Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES: OrderStatus[] = ["Pendente", "Pago", "Enviado", "Concluído"];

export function AdminOrders() {
  const orders = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("Pendente");
  const [editTracking, setEditTracking] = useState("");

  const handleOpen = (o: Order) => {
    setSelected(o);
    setEditStatus(o.status);
    setEditTracking(o.trackingCode || "");
  };

  const handleSave = () => {
    if (!selected) return;
    ordersApi.updateOrder(selected.id, {
      status: editStatus,
      trackingCode: editStatus === "Enviado" ? editTracking.trim().toUpperCase() : selected.trackingCode,
    });
    toast.success("Pedido atualizado com sucesso!");
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            status: editStatus,
            trackingCode: editStatus === "Enviado" ? editTracking.trim().toUpperCase() : prev.trackingCode,
          }
        : null
    );
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Abra um pedido para atualizar o status e cadastrar o Código de Rastreio dos Correios quando enviado.
          </p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número do Pedido</TableHead>
              <TableHead>Cliente / Telefone</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Envio</TableHead>
              <TableHead>Código Rastreio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum pedido realizado ainda.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => handleOpen(o)}>
                  <TableCell className="font-mono text-xs font-semibold">{o.number}</TableCell>
                  <TableCell className="text-xs">{o.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.shippingOption === "retirada" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Store className="h-3.5 w-3.5" /> Retirar na Loja
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3.5 w-3.5" /> Entrega
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {o.trackingCode || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatBRL(o.total)}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        o.status === "Pago"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : o.status === "Enviado"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : o.status === "Concluído"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }
                    >
                      {o.status === "Enviado" && o.shippingOption === "retirada" ? "Pronto para Retirada" : o.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Edição de Pedido */}
      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-normal">
                  Editar Pedido <span className="font-mono font-bold">{selected.number}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                <div className="grid grid-cols-2 gap-4 text-sm p-4 rounded-lg bg-secondary/20 border border-border">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Cliente / Telefone
                    </p>
                    <p className="font-medium text-foreground">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Pagamento
                    </p>
                    <p className="font-medium text-foreground">{selected.payment}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border/60">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Endereço / Modalidade
                    </p>
                    <p className="text-foreground">
                      {selected.address.street}, Nº {selected.address.number}
                      {selected.address.complement && ` (${selected.address.complement})`}<br />
                      {selected.address.neighborhood} · {selected.address.city}/{selected.address.state} · CEP {selected.address.cep}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Itens Comprados
                  </p>
                  <div className="space-y-2.5">
                    {selected.items.map((i) => (
                      <div key={i.productId} className="flex items-center gap-3 text-sm p-2 rounded-lg border bg-background">
                        <img src={i.image} alt="" className="h-12 w-12 rounded object-cover bg-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{i.name}</p>
                          <p className="text-xs text-muted-foreground">Qtd: {i.quantity}</p>
                        </div>
                        <span className="tabular-nums font-semibold">{formatBRL(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-sm border-t border-border/60 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatBRL(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="tabular-nums">{selected.shipping === 0 ? "Grátis" : formatBRL(selected.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border/60">
                    <span>Total do Pedido</span>
                    <span className="tabular-nums text-foreground">{formatBRL(selected.total)}</span>
                  </div>
                </div>

                {/* Campos de Edição do Vendedor */}
                <div className="p-4 rounded-lg border border-primary/20 bg-secondary/30 space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Atualizar Informações do Vendedor
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className={editStatus === "Enviado" ? "sm:col-span-1" : "sm:col-span-2"}>
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
                        Status do Pedido
                      </Label>
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as OrderStatus)}>
                        <SelectTrigger className="h-11 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s === "Enviado" && selected?.shippingOption === "retirada" ? "Pronto para Retirada" : s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exibe o campo de Código de Rastreio APENAS se o status for 'Enviado' */}
                    {editStatus === "Enviado" && (
                      <div>
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" /> Código de Rastreio (Correios)
                        </Label>
                        <Input
                          value={editTracking}
                          onChange={(e) => setEditTracking(e.target.value)}
                          placeholder="Ex: AA123456789BR"
                          className="h-11 font-mono uppercase bg-background text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSave} className="w-full h-11 rounded-full uppercase tracking-widest text-xs gap-2">
                    <Save className="h-4 w-4" /> Salvar Alterações do Pedido
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
