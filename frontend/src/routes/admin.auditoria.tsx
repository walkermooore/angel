import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuditLogs } from "@/lib/auditStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, History, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/auditoria")({
  component: AdminAuditoria,
});

function AdminAuditoria() {
  const logs = useAuditLogs();
  const [filter, setFilter] = useState("");

  const filteredLogs = logs.filter((log) => {
    const q = filter.trim().toLocaleLowerCase("pt-BR");
    if (!q) return true;

    return [log.orderNumber, log.action, log.user, log.details].some((value) =>
      String(value ?? "").toLocaleLowerCase("pt-BR").includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Auditoria de Pedidos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico completo de todas as movimentações, atualizações de status e cadastros em pedidos.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por pedido, ação..."
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Detalhes da Movimentação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum registro de auditoria encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {log.orderNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {log.action || "Evento registrado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {log.user || "Sistema"}
                  </TableCell>
                  <TableCell className="text-xs text-foreground max-w-md leading-relaxed">
                    {log.details || "Sem detalhes adicionais."}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 rounded-xl border border-primary/20 bg-secondary/20 flex items-center gap-3 text-xs text-muted-foreground">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
        <span>
          Todos os registros desta auditoria são imutáveis e mantidos automaticamente para segurança das operações de venda.
        </span>
      </div>
    </div>
  );
}
