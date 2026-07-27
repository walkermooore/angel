import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pedido-concluido")({
  head: () => ({ meta: [{ title: "Pedido Concluído — Angell" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    n: (s.n as string) ?? "",
    t: (s.t as string) ?? "",
  }),
  component: SuccessPage,
});

const steps = ["Pedido recebido", "Pagamento aprovado", "Em separação", "Enviado", "Entregue"];

function SuccessPage() {
  const { n, t } = Route.useSearch();
  const activeStep = 1;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24 text-center">
      <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
      <h1 className="font-display text-4xl sm:text-5xl mt-6">Pedido Realizado com Sucesso!</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        Seu pedido foi registrado com sucesso em nosso sistema. Você pode acompanhar a atualização do envio a qualquer momento.
      </p>

      {n && (
        <div className="mt-6 p-4 rounded-xl border border-border bg-secondary/30 max-w-md mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Código Único do Pedido</p>
          <p className="text-2xl font-mono font-bold tracking-wider text-foreground mt-1">{n}</p>
        </div>
      )}

      <div className="mt-10 border border-border rounded-xl p-6 sm:p-8 bg-secondary/10 text-left">
        <h2 className="font-display text-xl mb-6">Etapas do Pedido</h2>
        <ol className="space-y-4">
          {steps.map((label, i) => {
            const done = i <= activeStep;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild className="rounded-full h-11 px-8 uppercase tracking-widest text-xs gap-2">
          <Link to="/meu-pedido" search={{ n, t }}>
            <PackageCheck className="h-4 w-4" /> Acompanhar meu pedido
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full h-11 px-8 uppercase tracking-widest text-xs">
          <Link to="/produtos">Voltar aos produtos</Link>
        </Button>
      </div>
    </div>
  );
}
