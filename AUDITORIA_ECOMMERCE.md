# Auditoria e estado de produção do e-commerce Angell

**Revisão:** 27 de julho de 2026  
**Escopo:** frontend, backend, banco, checkout, painel, segurança, frete, estoque, privacidade, SEO, testes e operação.

Este documento substitui a auditoria anterior. Ele registra o estado atual do código, o que foi implementado, o que ainda falta e como testar.

## Legenda

- ✅ **Implementado:** existe no código e foi validado.
- 🟡 **Parcial:** a base existe, mas depende de evolução ou configuração externa.
- ❌ **Pendente crítico:** impede ou torna arriscada a venda em produção.
- ⏳ **Posterior:** não impede o primeiro lançamento.

## Resumo executivo

O projeto já possui uma base segura para criação de pedidos: o backend recalcula valores, controla estoque, valida frete, usa idempotência, recebe DTOs limitados e protege o acompanhamento público. Também existem cookies administrativos seguros, rate limiting, headers, SEO técnico, testes de integração, CI e métricas.

**O site ainda não deve aceitar vendas reais.** Os bloqueadores atuais são:

1. não existe integração real com gateway de pagamento;
2. ainda há dados empresariais de exemplo, incluindo CNPJ fictício;
3. o Melhor Envio precisa ser autorizado e homologado com credenciais reais;
4. peso e dimensões ainda não vêm do cadastro de cada produto;
5. backup, monitoramento e alertas precisam ser instalados na infraestrutura;
6. faltam testes E2E do checkout e auditoria sistemática de acessibilidade;
7. comunicação transacional, cancelamento, troca, devolução e reembolso não possuem fluxo completo.

| Área | Estado | Resumo |
|---|---:|---|
| Preços e totais | ✅ | Backend ignora valores comerciais do navegador |
| Confirmação e idempotência | ✅ | Sacola só é limpa após persistência |
| Estoque e concorrência | ✅ | Reserva transacional e teste da última unidade |
| Melhor Envio | 🟡 | OAuth e cotação; falta homologação e dados físicos reais |
| Pagamento | ❌ | Não há cobrança nem webhooks reais |
| Acompanhamento público | ✅ | Token/contato, DTO reduzido e rate limiting |
| Dados do cliente | ✅ | Nome, telefone e e-mail persistidos |
| Painel | 🟡 | Cookie HttpOnly e CSRF; faltam 2FA e revogação |
| Imagens | 🟡 | Limites e assinaturas; ainda usa Base64/banco |
| Checkout | 🟡 | Revisão e retry; faltam E2E e refinamento dos erros |
| Legal e privacidade | ❌ | Textos precisam dos dados reais |
| Backup e incidentes | 🟡 | Scripts e política; falta implantação |
| SEO técnico | ✅ | URLs, sitemap, robots, feed e JSON-LD |
| Testes e CI | 🟡 | Boa base backend; faltam E2E e contrato |
| Observabilidade | 🟡 | Métricas definidas; falta operar o stack |

## Validação geral

### Backend

```bash
cd backend
./mvnw test
```

Resultado esperado nesta revisão: **14 testes aprovados**. A suíte cobre criação segura, adulteração de preço, estoque, concorrência, expiração, idempotência, acompanhamento, rate limiting, autenticação, CORS, headers e payload inesperado.

### Frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev --audit-level=high
```

Esperado: lint sem erros (há avisos não bloqueantes de Fast Refresh), TypeScript e build aprovados e nenhuma vulnerabilidade alta de produção. Há alertas altos na cadeia de desenvolvimento do ESLint; não entram no bundle, mas devem ser acompanhados.

### Docker

```bash
docker build -t angell-backend:test ./backend
docker build -t angell-frontend:test ./frontend
```

As duas imagens foram construídas com sucesso durante a implementação.

## 1. Pagamento

**Estado: ❌ pendente crítico**

O pedido é persistido, mas não há cobrança real em PIX, cartão ou boleto.

### Falta

- escolher e integrar um provedor;
- criar cobrança somente no backend;
- aplicar idempotência no provedor;
- validar assinatura e origem de webhooks;
- tratar aprovação, recusa, expiração, estorno e reembolso;
- impedir mudança de pagamento pelo navegador;
- conciliar cobranças pendentes;
- nunca armazenar dados completos do cartão.

O frontend deixou de emitir `CHARGE_CREATED` apenas porque o pedido foi salvo. O evento deverá voltar somente quando existir cobrança real.

### Como testar depois

Pagamento aprovado, recusado e expirado; webhook inválido, duplicado e fora de ordem; falha de rede; estorno; valor cobrado igual ao total do backend; confirmação depois da expiração da reserva.

## 2. Preços, totais e mass assignment

**Estado: ✅ implementado**

O backend recebe DTO limitado, consulta produtos, valida se estão ativos, recalcula preço, desconto, subtotal, frete e total, define o status e salva snapshot comercial. Campos JSON inesperados são rejeitados.

### Como testar

Injete pelo DevTools campos como:

```json
{"price":1,"subtotal":1,"shipping":0,"total":1,"status":"PAID"}
```

A requisição deve ser rejeitada ou os campos jamais devem influenciar o pedido salvo.

## 3. Confirmação e idempotência

**Estado: ✅ implementado**

O frontend aguarda o backend, bloqueia o botão, mostra processamento, preserva a sacola em erro e só a limpa após confirmação. A chave de idempotência evita duplicidade.

### Como testar

Desligue o backend antes de confirmar e verifique que a sacola permanece. Depois envie duas vezes com a mesma chave: somente um pedido deve existir.

## 4. Acompanhamento público

**Estado: ✅ implementado**

- UUID interno não basta para consulta;
- acesso por número e contato ou token longo;
- DTO reduzido, e-mail mascarado e endereço omitido;
- rate limiting e correlação;
- `PEDIDO FINALIZADO` quando concluído;
- link de WhatsApp para atendimento.

### Como testar

UUID sozinho e contato incorreto não devem revelar dados. Número e contato corretos retornam apenas o DTO público. Muitas tentativas devem ser limitadas.

## 5. Estoque

**Estado: ✅ base implementada; 🟡 variantes**

Existem quantidades disponível, reservada, vendida e mínima, movimentações, ajuste auditado, reserva transacional, bloqueio pessimista, expiração, liberação, baixa e teste concorrente.

```bash
cd backend
./mvnw -Dtest=SecurityAndOrderIntegrationTests test
```

Manualmente, deixe uma unidade e execute dois checkouts simultâneos: somente um deve reservar. Cancelamento/expiração devolve a unidade; conclusão migra para vendida.

Faltam variantes, importação/exportação, alerta em canal real e devolução integrada ao reembolso.

## 6. Melhor Envio

**Estado: 🟡 implementado, dependente de homologação**

Há cotação no backend, OAuth por `authorization_code`, renovação por `refresh_token`, tokens protegidos, `User-Agent`, sandbox/produção, revalidação da cotação e retirada sem cotação. O fluxo “pronto para retirada” foi corrigido.

### Configurar

Client ID, client secret, redirect URI exata, User-Agent com contato, chave de criptografia, CEP de origem e ambiente. Sandbox e produção são independentes.

### Limitação

Peso e dimensões ainda são padrão. Cada produto/variante precisa de peso, altura, largura e comprimento reais.

### Como testar

Autorize no sandbox, calcule frete, finalize com a cotação, tente adulterá-la, teste renovação do token e valide retirada separadamente.

## 7. Dados e validação

**Estado: ✅ implementado**

Nome, telefone e e-mail são normalizados, validados e persistidos. Há limites e validação de CEP, UF, UUID e quantidade, DTOs restritos, campos desconhecidos rejeitados e erros centralizados. CPF não deve ser coletado sem finalidade real.

Teste e-mail, telefone, CEP, UF, quantidade e UUID inválidos. A resposta deve ser 4xx, sem stack trace.

## 8. Rate limiting

**Estado: ✅ instância única; 🟡 ambiente distribuído**

Há limites para login, pedido, acompanhamento, frete e APIs públicas, com atraso e bloqueio de login.

```bash
cd backend
./mvnw -Dtest=RateLimitIntegrationTests test
```

Em várias réplicas, migrar o estado para Redis, gateway ou WAF. CAPTCHA adaptativo ainda não existe.

## 9. Painel administrativo

**Estado: 🟡 fortalecido**

JWT, BCrypt, ADMIN, cookie `HttpOnly`, `Secure` em produção, `SameSite=Strict`, CSRF, expiração, CORS e bloqueio de login estão implementados. O token não fica no `localStorage`.

Faltam 2FA, troca/recuperação de senha, gestão de admins, revogação/lista de sessões, renovação controlada e alertas de acesso.

Teste acesso sem cookie, alteração sem CSRF, origem não permitida e repetição de senha errada.

## 10. HTTPS, headers e erros

**Estado: ✅ código; 🟡 proxy**

Existem handler central, mensagens genéricas, correlação, logs internos, HSTS, CSP, bloqueio de frames, Referrer-Policy, Permissions-Policy e configuração de HTTPS.

```bash
curl -I https://SEU_DOMINIO
curl -i https://SEU_DOMINIO/api/rota-inexistente
```

Não devem aparecer SQL, classes, caminhos, segredos ou stack trace. O proxy deve encaminhar corretamente o protocolo original.

## 11. Imagens

**Estado: 🟡 parcial**

Há limite de 2 MB, payload reduzido, JPEG/PNG/WebP e validação da assinatura do arquivo. Faltam S3/R2, upload assinado, CDN, remoção de metadados, redimensionamento, WebP/AVIF e imagens responsivas. Base64 no banco deve ser substituído antes de ampliar muito o catálogo.

## 12. Segredos e banco

**Estado: ✅ configuração; 🟡 infraestrutura**

Produção exige credenciais externas, suporta TLS e desativa bootstrap automático de admin. Na implantação: banco privado, usuário exclusivo, senha forte, secret manager, rotação, chaves por ambiente e remoção do bootstrap. `postgres/postgres` só no desenvolvimento isolado.

## 13. Checkout e erros

**Estado: ✅ revisão; 🟡 refinamento**

Há revisão de produtos, valores, contato, endereço, entrega, frete, pagamento e termos, com edição, retry e preservação dos dados. Falhas gerais, CEP e frete são visíveis.

Faltam erros junto a todos os campos, foco consistente no primeiro erro, leitor de tela e distinção mais detalhada das falhas. O checkout convidado deve permanecer.

## 14. Sacola

**Estado: 🟡 boa base**

Há persistência, quantidades, disponibilidade, remover/desfazer, resumo, frete e aviso de frete grátis. Faltam sincronização, salvar para depois, aviso explícito de mudança de preço e variantes.

## 15. Comunicações transacionais

**Estado: ❌ pendente**

Falta provedor de e-mail/WhatsApp para pedido, cobrança, pagamento, preparação, retirada, envio, rastreamento, conclusão, cancelamento e reembolso. Usar link seguro e dados mínimos.

## 16. Cancelamento, troca e devolução

**Estado: ❌ pendente**

Criar solicitação, protocolo, motivo, prazo, anexos, acompanhamento, painel, estorno, retorno ao estoque, mensagens e auditoria. Textos institucionais não substituem o processo.

## 17. Área do cliente

**Estado: ⏳ posterior**

Pode reunir pedidos, endereços, devoluções, notas, favoritos, recompra e direitos sobre dados. Não deve eliminar o checkout convidado.

## 18. Dados empresariais e legal

**Estado: ❌ pendente crítico**

Ainda há CNPJ e dados de exemplo. Inserir razão social, nome fantasia, CNPJ, endereço, contato, horários, prazos e regras reais. Revisar privacidade, termos, entrega, troca, devolução, provedores, retenção, bases legais e canal dos titulares.

## 19. Cookies

**Estado: ✅ base; 🟡 terceiros**

Há página, categorias, aceitar/rejeitar/revogar, versão e analytics condicionado ao consentimento. Antes de Analytics, pixels ou chat externo, inventariar e bloquear os não essenciais quando aplicável.

## 20. Backup e incidentes

**Estado: 🟡 artefatos prontos**

Existem `ops/backup-postgres.sh`, restauração e `POLITICA_BACKUP_INCIDENTES.md`. Falta agendar, criptografar, copiar para fora, monitorar, testar restauração, definir responsáveis e formalizar incidentes.

Teste restaurando em banco vazio, valide dados/constraints e registre RPO/RTO. Backup sem restauração testada não é válido.

## 21. SEO

**Estado: ✅ técnico; 🟡 cadastros externos**

Há URL por slug, title, description, canonical, Open Graph, Twitter Cards, preço, disponibilidade, frete, devolução, JSON-LD, sitemap, robots, feed e 404.

Faltam domínio/dados finais, Search Console, Merchant Center, envio dos arquivos, monitoramento, validação dos dados estruturados e variantes.

```bash
curl -I https://SEU_DOMINIO/robots.txt
curl -I https://SEU_DOMINIO/sitemap.xml
curl -I https://SEU_DOMINIO/produtos.xml
```

## 22. Acessibilidade

**Estado: 🟡 auditoria completa pendente**

Há `aria-live` e melhorias pontuais. Testar teclado, foco, diálogos, contraste, zoom, leitor de tela, movimento, toque, Lighthouse e axe. Automação não substitui o teste manual.

## 23. Testes

**Estado: 🟡 backend bem coberto**

Já cobre autenticação, criação segura, adulteração, produto inativo, estoque, concorrência, idempotência, expiração, acompanhamento, rate limiting, CORS, headers, payload, frete, status e health.

Faltam frontend unitário, Playwright/Cypress, axe, contrato, PostgreSQL/Testcontainers, pagamento/webhooks, cancelamento/reembolso, Melhor Envio controlado e smoke pós-deploy.

## 24. CI/CD

**Estado: ✅ CI; 🟡 deploy**

`.github/workflows/ci.yml` executa testes, lint, TypeScript, build, auditoria de produção, detecção de segredos e imagens. Faltam provedor, ambientes, deploy aprovado, migrações, smoke e rollback ensaiado.

## 25. Observabilidade

**Estado: 🟡 instrumentação**

Há correlação, Actuator, Prometheus, HTTP/JVM/banco, latência do Melhor Envio, pedidos presos, `ops/prometheus-alerts.yml` e `OBSERVABILIDADE_E_CI.md`.

Faltam coletor, dashboards, logs centralizados, uptime, canal de alertas, erros frontend, alertas de backup/webhooks e SLOs.

## 26. Funil

**Estado: 🟡 iniciado com privacidade**

Há eventos consentidos para produto, sacola, checkout, entrega, frete, pagamento selecionado e erro. Faltam plataforma, abandono, cobrança real, pagamento aprovado, conclusão, dashboards e política de retenção.

## 27. Prioridades

### P0 — antes de vendas reais

- [ ] pagamento, webhooks, estorno e conciliação;
- [ ] dados empresariais e documentos legais reais;
- [ ] peso/dimensões e homologação do Melhor Envio;
- [ ] domínio, HTTPS, segredos e banco privado;
- [ ] backup externo restaurado;
- [ ] monitoramento e alertas;
- [ ] E2E desktop/celular e auditoria de acessibilidade;
- [ ] compra completa de homologação.

### P1 — operação

- [ ] comunicações;
- [ ] cancelamento, troca, devolução e reembolso;
- [ ] S3/R2 e CDN;
- [ ] rate limiting distribuído;
- [ ] 2FA e revogação;
- [ ] Testcontainers, Playwright e axe;
- [ ] deploy/rollback;
- [ ] Search Console, Merchant Center e dashboards.

### P2 — evolução

- [ ] variantes;
- [ ] salvar para depois e sincronizar sacola;
- [ ] área opcional do cliente;
- [ ] favoritos e recompra.

## 28. Checklist de produção

- [ ] adulteração não muda valores/status;
- [ ] concorrência não vende duas vezes;
- [ ] retry não duplica pedido;
- [ ] falha não limpa a sacola;
- [ ] pagamento só muda por evento confiável;
- [ ] webhook inválido não altera pedido;
- [ ] retirada e entrega funcionam;
- [ ] cotação adulterada é recusada;
- [ ] acompanhamento não expõe dados;
- [ ] painel exige cookie e CSRF;
- [ ] rate limiting funciona na infraestrutura;
- [ ] erros não expõem detalhes;
- [ ] dados legais são verdadeiros;
- [ ] backup foi restaurado;
- [ ] alertas chegam ao responsável;
- [ ] checkout passou em acessibilidade e dispositivos;
- [ ] SEO usa domínio oficial;
- [ ] smoke e rollback foram ensaiados.

## Arquivos importantes

- `backend/src/main/java/com/angel/backend/`
- `backend/src/test/`
- `frontend/src/routes/checkout.tsx`
- `frontend/src/lib/store.ts`
- `frontend/src/routes/produtos.$slug.tsx`
- `.github/workflows/ci.yml`
- `ops/backup-postgres.sh`
- `ops/prometheus-alerts.yml`
- `POLITICA_BACKUP_INCIDENTES.md`
- `OBSERVABILIDADE_E_CI.md`

## Referências

- OWASP ASVS: <https://owasp.org/www-project-application-security-verification-standard/>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
- Decreto nº 7.962/2013: <https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm>
- ANPD: <https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-vf.pdf>
- Google Product: <https://developers.google.com/search/docs/appearance/structured-data/product>
- Google e-commerce: <https://developers.google.com/search/docs/specialty/ecommerce/how-to-launch-an-ecommerce-website>
- Baymard: <https://baymard.com/blog/ecommerce-checkout-usability-report-and-benchmark>
- Melhor Envio: <https://docs.melhorenvio.com.br/>
