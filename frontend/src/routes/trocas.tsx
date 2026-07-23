import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções — Angel" }] }),
  component: TrocasPage,
});

function TrocasPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl sm:text-5xl">Trocas e Devoluções</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Política de Satisfação Garantida</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Queremos que você fique 100% satisfeita com sua compra na <strong className="text-foreground">Angel</strong>. Caso precise trocar ou devolver um produto, siga as orientações abaixo:
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">1. Prazo para Devolução por Arrependimento</h2>
        <p>
          Você tem até <strong>7 (sete) dias corridos</strong> após o recebimento do pedido para solicitar a devolução total ou parcial dos produtos por arrependimento, conforme previsto no Código de Defesa do Consumidor.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">2. Prazo para Trocas</h2>
        <p>
          As solicitações de troca por outro modelo ou tamanho podem ser feitas em até <strong>30 (trinta) dias corridos</strong> a contar do recebimento da encomenda.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">3. Condições dos Produtos</h2>
        <p>
          O produto deve ser devolvido em sua embalagem original, acompanhado da nota fiscal/certificado de garantia da prata 925, sem indícios de uso ou avaria.
        </p>

        <h2 className="text-lg font-semibold text-foreground mt-6">4. Como Solicitar</h2>
        <p>
          Envie uma mensagem via WhatsApp para nosso atendimento pelo número <strong className="text-foreground">[contato removido]</strong> informando o número do seu pedido e o motivo da troca.
        </p>
      </div>
    </div>
  );
}
