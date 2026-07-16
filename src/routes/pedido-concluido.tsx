import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pedido-concluido")({
  head: () => ({ meta: [{ title: "Pedido concluído — Angel" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ n: (s.n as string) ?? "" }),
  component: SuccessPage,
});

const steps = ["Pagamento aprovado", "Separando", "Enviado", "Entregue"];

function SuccessPage() {
  const { n } = Route.useSearch();
  const activeStep = 1;
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24 text-center">
      <CheckCircle2 className="h-16 w-16 mx-auto text-foreground" strokeWidth={1} />
      <h1 className="font-display text-4xl sm:text-5xl mt-6">Obrigada pela sua compra</h1>
      <p className="text-muted-foreground mt-3">Enviamos os detalhes por e-mail. Seu pedido já está sendo preparado com carinho.</p>
      {n && (
        <p className="mt-6 inline-block px-5 py-2 rounded-full border border-border text-sm">
          Número do pedido: <strong className="ml-1 tabular-nums">{n}</strong>
        </p>
      )}

      <div className="mt-12 border border-border rounded-lg p-6 sm:p-8 bg-secondary/20 text-left">
        <h2 className="font-display text-xl mb-6">Status do pedido</h2>
        <ol className="space-y-4">
          {steps.map((label, i) => {
            const done = i <= activeStep;
            return (
              <li key={label} className="flex items-center gap-3">
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className={done ? "font-medium" : "text-muted-foreground"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <Button asChild className="mt-10 rounded-full h-12 px-10 uppercase tracking-widest text-xs">
        <Link to="/produtos">Continuar comprando</Link>
      </Button>
    </div>
  );
}
