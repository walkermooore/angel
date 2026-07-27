# Observabilidade, testes e entrega contínua

## Endpoints e métricas

- `GET /actuator/health`: health check público sem detalhes internos.
- `GET /actuator/prometheus`: métricas para coletor na rede privada; não deve ser publicado na internet.
- `http.server.requests`: volume, latência e erros por endpoint.
- `hikaricp.*`: conexões e uso do pool PostgreSQL.
- `jvm.*` e `process.*`: memória, CPU, threads e processo.
- `angell.orders.stuck.pending`: pedidos pendentes há mais de 24 horas.
- `angell.external.api.duration`: latência do Melhor Envio.
- `angell.funnel.events`: funil agregado por evento e contexto técnico.

Os logs incluem `correlationId`; em produção use `LOG_FORMAT=ecs` para JSON estruturado. Alertas iniciais para indisponibilidade, 5xx, pedidos presos e Melhor Envio lento estão em `ops/prometheus-alerts.yml`.

## Privacidade do funil

O navegador só envia evento quando a categoria analytics foi aceita. Não são enviados nome, contato, IP escolhido pela aplicação, código de pedido, produto individual ou identificador de sessão. O backend aceita apenas uma enumeração fechada e agrega contadores.

## CI e imagens

`.github/workflows/ci.yml` executa testes Java, lint, TypeScript, build SSR, auditoria de dependências, detecção de segredos e build das imagens. Pushes publicam imagens imutáveis no GHCR com o SHA.

O deploy efetivo deve promover a imagem pelo SHA no provedor escolhido. Migrações Flyway executam no início do backend; faça snapshot antes da promoção. O health check deve passar antes de trocar tráfego. Rollback significa promover novamente a tag SHA anterior; migrações destrutivas devem ser separadas em fases compatíveis.

## Limites atuais

Pagamento e webhook ainda não existem. Testes de aprovação, recusa, assinatura, duplicidade e monitoramento de webhook só serão reais depois da escolha e implementação do gateway. Testes E2E de navegador e acessibilidade exigem adicionar Playwright/axe e seus binários; isso deve entrar junto da definição do ambiente de checkout/pagamento.
