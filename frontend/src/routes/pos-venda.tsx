import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  createAfterSalesRequest,
  trackAfterSalesRequest,
  uploadAfterSalesAttachment,
  type AfterSalesRequest,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Search, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pos-venda")({
  validateSearch: (search: Record<string, unknown>) => ({
    n: String(search.n || ""),
    t: String(search.t || ""),
    p: String(search.p || ""),
  }),
  head: () => ({ meta: [{ title: "Cancelamento, troca e devolução — Angell" }] }),
  component: AfterSalesPage,
});

function AfterSalesPage() {
  const search = Route.useSearch();
  const [orderNumber, setOrderNumber] = useState(search.n);
  const [trackingToken] = useState(search.t);
  const [contact, setContact] = useState("");
  const [requestType, setRequestType] = useState("CANCELAMENTO");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [protocol, setProtocol] = useState(search.p);
  const [accessToken, setAccessToken] = useState(search.t && search.p ? search.t : "");
  const [result, setResult] = useState<AfterSalesRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = await createAfterSalesRequest({
        orderNumber: orderNumber.trim(),
        trackingToken: trackingToken || undefined,
        contact: trackingToken ? undefined : contact.trim(),
        requestType,
        reason: reason.trim(),
        details: details.trim(),
        attachmentUrls: attachments,
      });
      setResult(saved);
      setProtocol(saved.protocol);
      setAccessToken(saved.accessToken);
      toast.success("Solicitação criada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a solicitação.");
    } finally {
      setBusy(false);
    }
  };

  const track = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      setResult(await trackAfterSalesRequest(protocol.trim(), accessToken.trim()));
    } catch (error) {
      setResult(null);
      toast.error(error instanceof Error ? error.message : "Solicitação não encontrada.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || attachments.length >= 3) return;
    try {
      const saved = await uploadAfterSalesAttachment(file);
      setAttachments((current) => [...current, saved.url]);
      toast.success("Anexo enviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o anexo.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 sm:py-20 space-y-10">
      <div>
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground">Pós-venda</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Cancelamento, troca e devolução</h1>
        <p className="text-sm text-muted-foreground mt-3">Abra uma solicitação ou acompanhe um protocolo existente.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Nova solicitação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div><Label htmlFor="after-order">Pedido</Label><Input id="after-order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ANG-..." required /></div>
              {!trackingToken && <div><Label htmlFor="after-contact">E-mail ou telefone da compra</Label><Input id="after-contact" value={contact} onChange={(e) => setContact(e.target.value)} required /></div>}
              <div>
                <Label>Tipo</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CANCELAMENTO">Cancelamento</SelectItem>
                    <SelectItem value="TROCA">Troca</SelectItem>
                    <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="after-reason">Motivo</Label><Input id="after-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} required /></div>
              <div><Label htmlFor="after-details">Detalhes</Label><Textarea id="after-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={3000} /></div>
              <div>
                <Label htmlFor="after-file">Anexos ({attachments.length}/3)</Label>
                <Input id="after-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={attachments.length >= 3} />
                <p className="text-xs text-muted-foreground mt-1 flex gap-1"><Paperclip className="h-3.5 w-3.5" /> JPEG, PNG ou WebP, até 2 MB.</p>
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2"><Send className="h-4 w-4" /> Enviar solicitação</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Acompanhar protocolo</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={track} className="space-y-4">
              <div><Label htmlFor="after-protocol">Protocolo</Label><Input id="after-protocol" value={protocol} onChange={(e) => setProtocol(e.target.value)} placeholder="POS-..." required /></div>
              <div><Label htmlFor="after-token">Código seguro</Label><Input id="after-token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" required /></div>
              <Button type="submit" disabled={busy} variant="outline" className="w-full gap-2"><Search className="h-4 w-4" /> Consultar</Button>
            </form>
            {result && <RequestStatus request={result} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequestStatus({ request }: { request: AfterSalesRequest }) {
  return (
    <div className="rounded-xl border bg-secondary/20 p-5 space-y-2" role="status">
      <p className="font-mono font-semibold">{request.protocol}</p>
      <p className="text-sm">Status: <strong>{request.status.replaceAll("_", " ")}</strong></p>
      <p className="text-sm">Estorno: <strong>{request.refundStatus.replaceAll("_", " ")}</strong></p>
      <p className="text-xs text-muted-foreground">Prazo de resposta: {new Date(request.deadlineAt).toLocaleDateString("pt-BR")}</p>
      {request.adminNote && <p className="text-sm border-t pt-2">{request.adminNote}</p>}
      <p className="text-xs text-muted-foreground flex gap-1 pt-2"><ShieldCheck className="h-3.5 w-3.5" /> Guarde o código seguro recebido. Não o compartilhe.</p>
    </div>
  );
}
