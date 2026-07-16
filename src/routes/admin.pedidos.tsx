import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useOrders, ordersApi, type Order, type OrderStatus } from "@/lib/store";
import { formatBRL } from "@/lib/cart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES: OrderStatus[] = ["Pendente", "Pago", "Enviado", "Concluído"];

function AdminOrders() {
  const orders = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Pedidos</h1>
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum pedido ainda.</TableCell></TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                <TableCell className="font-mono text-xs">{o.number}</TableCell>
                <TableCell>{o.email}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatBRL(o.total)}</TableCell>
                <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-normal">Pedido {selected.number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Cliente</p>
                    <p>{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pagamento</p>
                    <p>{selected.payment}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Endereço de entrega</p>
                    <p>
                      {selected.address.street}, {selected.address.number}
                      {selected.address.complement && ` - ${selected.address.complement}`}<br />
                      {selected.address.neighborhood} · {selected.address.city}/{selected.address.state} · CEP {selected.address.cep}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Itens</p>
                  <div className="space-y-2">
                    {selected.items.map((i) => (
                      <div key={i.productId} className="flex items-center gap-3 text-sm">
                        <img src={i.image} alt="" className="h-10 w-10 rounded object-cover bg-muted" />
                        <span className="flex-1">{i.name} × {i.quantity}</span>
                        <span className="tabular-nums">{formatBRL(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-sm border-t border-border/60 pt-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatBRL(selected.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">{formatBRL(selected.shipping)}</span></div>
                  <div className="flex justify-between font-medium"><span>Total</span><span className="tabular-nums">{formatBRL(selected.total)}</span></div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                  <Select value={selected.status} onValueChange={(v) => {
                    ordersApi.updateStatus(selected.id, v as OrderStatus);
                    setSelected({ ...selected, status: v as OrderStatus });
                  }}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
