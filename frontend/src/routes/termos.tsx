import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de Uso — Angel" }] }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Termos de Uso</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Condições Gerais de Uso da Plataforma</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Bem-vinda à loja online da <strong className="text-foreground">Angel</strong>. Ao acessar e utilizar este site, você concorda com os seguintes termos e condições:
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">1. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo visual, fotografias, marcas, nomes comerciais e design do site são de propriedade exclusiva da marca Angel. É proibida a reprodução sem autorização prévia por escrito.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">2. Informações dos Produtos e Preços</h2>
        <p>
          Trabalhamos para garantir que todas as descrições, preços e disponibilidades dos produtos estejam corretos. Reservamo-nos o direito de corrigir eventuais erros tipográficos de preço sem aviso prévio.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">3. Garantia das Joias em Prata 925</h2>
        <p>
          Garantimos a autenticidade do teor da Prata 925 de nossas peças. A garantia não cobre mau uso, quedas, arranhões ou exposição a reagentes químicos agressivos.
        </p>
      </div>
    </div>
  );
}
