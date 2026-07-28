import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Box, CircleAlert, Info, PackageX } from "lucide-react";
import { useProducts } from "@/lib/store";
import { availableProductQuantity, hasProductShippingDimensions } from "@/lib/products";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/avisos")({
  component: AdminAlertsPage,
});

function AdminAlertsPage() {
  const products = useProducts();
  const withoutShippingData = products.filter((product) => !hasProductShippingDimensions(product));
  const withoutStock = products.filter((product) => availableProductQuantity(product) === 0);
  const lowStock = products.filter((product) => {
    const available = availableProductQuantity(product);
    return available > 0 && available <= Number(product.minimumStock ?? 3);
  });
  const withReservations = products.filter((product) => Number(product.reservedQuantity ?? 0) > 0);
  const total = withoutShippingData.length + withoutStock.length + lowStock.length;

  const sections = [
    {
      title: "Frete não configurado",
      description: "Estes produtos não podem receber cotação do Melhor Envio até terem peso e dimensões reais.",
      products: withoutShippingData,
      icon: Box,
      tone: "border-destructive/30 bg-destructive/5 text-destructive",
      detail: () => "Peso ou dimensões pendentes",
    },
    {
      title: "Produtos sem estoque",
      description: "Produtos sem unidades disponíveis ficam fora da loja.",
      products: withoutStock,
      icon: PackageX,
      tone: "border-destructive/30 bg-destructive/5 text-destructive",
      detail: () => "0 unidades disponíveis",
    },
    {
      title: "Estoque baixo",
      description: "A quantidade disponível atingiu o limite mínimo configurado.",
      products: lowStock,
      icon: AlertTriangle,
      tone: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
      detail: (product: (typeof products)[number]) =>
        `${availableProductQuantity(product)} disponíveis · mínimo ${product.minimumStock ?? 3}`,
    },
    {
      title: "Estoque reservado",
      description: "Informação operacional sobre unidades temporariamente reservadas em pedidos.",
      products: withReservations,
      icon: Info,
      tone: "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-400",
      detail: (product: (typeof products)[number]) => `${product.reservedQuantity} unidades reservadas`,
    },
  ];

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Avisos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pendências do catálogo e situações que precisam de atenção.
          </p>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${total > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
          {total > 0 ? `${total} pendência${total === 1 ? "" : "s"}` : "Tudo em ordem"}
        </div>
      </div>

      {total === 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex gap-4">
          <CircleAlert className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <h2 className="font-semibold">Nenhuma pendência crítica no catálogo</h2>
            <p className="text-sm text-muted-foreground mt-1">Estoque e dados físicos dos produtos estão preenchidos.</p>
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className={`rounded-xl border p-5 ${section.tone}`}>
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-foreground">{section.title}</h2>
                    <span className="text-sm font-bold">{section.products.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>
              {section.products.length > 0 && (
                <div className="mt-4 space-y-2">
                  {section.products.map((product) => (
                    <div key={product.id} className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.detail(product)}</p>
                    </div>
                  ))}
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link to="/admin/produtos">Corrigir nos produtos</Link>
                  </Button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
