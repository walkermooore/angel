import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getAfterSalesRequests,
  getTransactionalCommunications,
  retryTransactionalCommunication,
  updateAfterSalesRequest,
  type AfterSalesRequest,
  type TransactionalCommunication,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pos-venda")({
  component: AdminAfterSales,
});

function AdminAfterSales() {
  const [requests, setRequests] = useState<AfterSalesRequest[]>([]);
  const [communications, setCommunications] = useState<TransactionalCommunication[]>([]);
  const [selected, setSelected] = useState<AfterSalesRequest | null>(null);
  const [status, setStatus] = useState("EM_ANALISE");
  const [refundStatus, setRefundStatus] = useState("NOT_REQUESTED");
  const [adminNote, setAdminNote] = useState("");
  const [returnToStock, setReturnToStock] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [afterSales, messages] = await Promise.all([
      getAfterSalesRequests(),
      getTransactionalCommunications(),
    ]);
    setRequests(afterSales || []);
    setCommunications(messages || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const open = (request: AfterSalesRequest) => {
    setSelected(request);
    setStatus(request.status);
    setRefundStatus(request.refundStatus);
    setAdminNote(request.adminNote || "");
    setReturnToStock(false);
  };

  const save = async () => {
    if (!selected) return;
    try {
      await updateAfterSalesRequest(selected.id, { status, refundStatus, adminNote, returnToStock });
      toast.success("Solicitação atualizada e comunicação enfileirada.");
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="font-display text-3xl sm:text-4xl">Pós-venda e comunicações</h1><p className="text-sm text-muted-foreground mt-1">Solicitações, estornos, estoque e entregas transacionais.</p></div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
      </div>

      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">Solicitações ({requests.length})</TabsTrigger><TabsTrigger value="messages">Comunicações ({communications.length})</TabsTrigger></TabsList>
        <TabsContent value="requests">
          <Card><CardHeader><CardTitle>Cancelamentos, trocas e devoluções</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Protocolo</TableHead><TableHead>Pedido</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Prazo</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{requests.map((request) => <TableRow key={request.id}>
                <TableCell className="font-mono">{request.protocol}</TableCell><TableCell>{request.orderNumber}</TableCell>
                <TableCell>{request.requestType}</TableCell><TableCell>{request.status.replaceAll("_", " ")}</TableCell>
                <TableCell>{new Date(request.deadlineAt).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => open(request)}>Analisar</Button></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="messages">
          <Card><CardHeader><CardTitle>Fila transacional</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Canal</TableHead><TableHead>Evento</TableHead><TableHead>Destino</TableHead><TableHead>Status</TableHead><TableHead>Tentativas</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{communications.map((message) => <TableRow key={message.id}>
                <TableCell>{message.orderNumber}</TableCell><TableCell>{message.channel}</TableCell><TableCell>{message.eventType}</TableCell>
                <TableCell>{message.recipient}</TableCell><TableCell>{message.status}</TableCell><TableCell>{message.attempts}</TableCell>
                <TableCell>{["FAILED", "RETRY", "AWAITING_CONFIGURATION"].includes(message.status) && <Button size="sm" variant="outline" onClick={async () => { await retryTransactionalCommunication(message.id); await load(); }}>Repetir</Button>}</TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selected)} onOpenChange={(openState) => !openState && setSelected(null)}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle className="flex gap-2"><MessageCircle className="h-5 w-5" /> {selected?.protocol}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {["RECEBIDA", "EM_ANALISE", "APROVADA", "AGUARDANDO_ENVIO", "ITEM_RECEBIDO", "CONCLUIDA", "RECUSADA", "CANCELADA"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}
            </SelectContent></Select></div>
            <div><Label>Estorno</Label><Select value={refundStatus} onValueChange={setRefundStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {["NOT_REQUESTED", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}
            </SelectContent></Select></div>
            <div><Label htmlFor="admin-note">Mensagem para o cliente</Label><Textarea id="admin-note" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><Input className="h-4 w-4" type="checkbox" checked={returnToStock} onChange={(e) => setReturnToStock(e.target.checked)} disabled={selected?.returnedToStock} /> Retornar todos os itens ao estoque</label>
            <Button className="w-full" onClick={save}>Salvar e comunicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
