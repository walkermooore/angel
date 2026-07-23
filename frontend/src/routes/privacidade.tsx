import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Angel" }] }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Política de Privacidade</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Última atualização: 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          A <strong className="text-foreground">Angel</strong> compromete-se com a segurança e a privacidade dos dados de nossos clientes durante todo o processo de navegação e compra pelo site.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">1. Coleta de Informações</h2>
        <p>
          Coletamos dados estritamente necessários para o processamento de compras, entrega de pedidos e comunicação referente aos seus pedidos (como nome, endereço, telefone de contato e endereço de e-mail).
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">2. Uso e Proteção dos Dados</h2>
        <p>
          Seus dados pessoais não serão vendidos, trocados ou divulgados para terceiros, exceto quando essas informações são necessárias para o processo de entrega ou cobrança.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">3. Segurança</h2>
        <p>
          Utilizamos protocolos de segurança padrão de mercado (criptografia SSL) para garantir que todas as transações sejam 100% seguras e confidenciais.
        </p>
      </div>
    </div>
  );
}
