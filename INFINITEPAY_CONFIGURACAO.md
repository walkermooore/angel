# Configuração da InfinitePay

A integração usa o Checkout Integrado hospedado da InfinitePay. O cliente é redirecionado para a página segura da InfinitePay, escolhe Pix ou cartão e retorna à loja depois do pagamento.

## O que já está implementado

- criação do link usando os valores recalculados e salvos pelo backend;
- identificação pelo número único do pedido (`order_nsu`);
- envio dos produtos, frete, cliente e endereço;
- redirecionamento para o checkout hospedado;
- webhook de aprovação;
- confirmação do webhook por meio do endpoint `payment_check`;
- conferência do valor pago com o total do pedido;
- atualização idempotente do pedido para **Pago**;
- armazenamento da transação, comprovante, parcelas e método de captura;
- integração desativada por padrão.

## Dados necessários

Na documentação pública atual, a criação do Checkout Integrado utiliza a **InfiniteTag** da conta, chamada de `handle`, sem o caractere `$`. Não há token ou client secret no payload documentado.

Antes de ativar, confirme no painel da conta se a InfinitePay forneceu algum mecanismo adicional específico para o estabelecimento.

Configure no ambiente do backend:

```env
INFINITEPAY_ENABLED=false
INFINITEPAY_BASE_URL=https://api.checkout.infinitepay.io
INFINITEPAY_HANDLE=infinite_tag_sem_cifrao
INFINITEPAY_REDIRECT_BASE_URL=https://www.seudominio.com
INFINITEPAY_WEBHOOK_URL=https://api.seudominio.com/api/pagamentos/infinitepay/webhook
```

Enquanto `INFINITEPAY_ENABLED=false`, o checkout atual continua funcionando sem fazer chamadas à InfinitePay.

## Como ativar

1. Entre no aplicativo ou painel web da InfinitePay.
2. Acesse **Vendas → Checkout → Configurações**.
3. Habilite o Checkout Integrado.
4. Confirme a InfiniteTag da conta.
5. Configure URLs públicas HTTPS para frontend e backend.
6. Preencha as variáveis acima.
7. Reinicie o backend.
8. Confirme no painel administrativo que a situação aparece como **Pronta para uso**.
9. Faça uma compra controlada.
10. Somente depois dos testes altere `INFINITEPAY_ENABLED=true` no ambiente definitivo.

## Testes obrigatórios

- criação do link com produtos e frete;
- pagamento por Pix;
- pagamento por cartão;
- tentativa de webhook com pedido inexistente;
- tentativa de webhook com valor adulterado;
- repetição do mesmo webhook;
- indisponibilidade temporária do `payment_check`;
- retorno do cliente sem recebimento do webhook;
- reserva e baixa de estoque após aprovação;
- abertura do comprovante salvo no pedido.

Não considere os parâmetros da URL de retorno como prova de pagamento. O pedido só deve ser aprovado depois da confirmação servidor a servidor.
