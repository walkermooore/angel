# Auditoria e estado de produção do e-commerce Angell

**Revisão:** 28 de julho de 2026
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

1. a integração com a InfinitePay está implementada, mas permanece desativada até a configuração e homologação da conta;
2. ainda há dados empresariais de exemplo, incluindo CNPJ fictício;
3. o Melhor Envio precisa ser autorizado e homologado com credenciais reais;
4. os produtos aceitam peso e dimensões reais, mas os dados definitivos ainda precisam ser cadastrados e validados;
5. backup, monitoramento e alertas precisam ser instalados na infraestrutura;
6. faltam testes E2E do checkout, incluindo a InfinitePay, e auditoria sistemática de acessibilidade;
7. comunicação transacional, cancelamento, troca, devolução, estorno e reembolso não possuem fluxo completo.

| Área | Estado | Resumo |
|---|---:|---|
| Preços e totais | ✅ | Backend ignora valores comerciais do navegador |
| Confirmação e idempotência | ✅ | Sacola só é limpa após persistência |
| Estoque e concorrência | ✅ | Reserva transacional e teste da última unidade |
| Melhor Envio | 🟡 | OAuth, cotação e medidas por produto; falta configuração e homologação real |
| Pagamento | 🟡 | Checkout e webhook InfinitePay implementados, mas desativados e não homologados |
| Acompanhamento público | ✅ | Token/contato, DTO reduzido e rate limiting |
| Dados do cliente | ✅ | Nome, telefone e e-mail persistidos |
| Painel | ✅ | Cookie HttpOnly, CSRF, 2FA TOTP, sessões revogáveis e avisos operacionais |
| Imagens | 🟡 | Arquivos fora do banco, upload seguro e migração legada; falta storage externo/CDN |
| Checkout | ✅ | Revisão, erros por campo, foco acessível, retry e E2E desktop/celular |
| Legal e privacidade | ❌ | Textos precisam dos dados reais |
| Backup e incidentes | 🟡 | Scripts e política; falta implantação |
| SEO técnico | ✅ | URLs, sitemap, robots, feed e JSON-LD |
| Testes e CI | 🟡 | Backend, frontend e imagens validados; faltam E2E e contrato |
| Observabilidade | 🟡 | Métricas definidas; falta operar o stack |

## Validação geral

### Backend

```bash
cd backend
./mvnw test
```

Resultado esperado nesta revisão: **18 testes aprovados**. A suíte cobre criação segura, adulteração de preço, estoque, persistência de ajustes, concorrência, expiração, idempotência, acompanhamento, rate limiting, autenticação, sessões revogáveis, preparação do 2FA, upload de imagens, CORS, headers, payload inesperado e estado desativado da InfinitePay.

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

## 1. Pagamento — InfinitePay

**Estado: 🟡 implementado no código; pendente de configuração e homologação**

A integração utiliza o Checkout Integrado hospedado da InfinitePay. O backend cria o link com os valores autoritativos do pedido, envia produtos, frete, cliente e endereço, e o frontend redireciona o cliente para o ambiente seguro do provedor.

O webhook não é aceito como prova isolada: o backend consulta `payment_check`, confere pedido, transação e valor, impede a troca de transação, processa repetições de forma idempotente e somente então altera o pedido de `PENDENTE` para `PAGO`. Os dados completos do cartão não passam pela aplicação.

A integração fica desativada por padrão com `INFINITEPAY_ENABLED=false`. Enquanto estiver desativada, nenhum link ou cobrança é criado.

### Configurar e homologar

- habilitar o Checkout Integrado na conta InfinitePay;
- confirmar a InfiniteTag (`handle`) sem o caractere `$`;
- configurar URLs públicas HTTPS de retorno e webhook;
- confirmar com a InfinitePay se a conta recebeu alguma credencial adicional não descrita na documentação pública;
- ativar `INFINITEPAY_ENABLED=true` somente no ambiente de homologação;
- testar Pix e cartão com valores controlados;
- tratar aprovação, recusa, expiração, estorno e reembolso;
- conciliar cobranças pendentes;
- definir operação para indisponibilidade e reprocessamento de webhooks.

Consulte `INFINITEPAY_CONFIGURACAO.md` para variáveis, ativação e testes. Não armazenar credenciais no repositório.

### Como testar

Pagamento aprovado, recusado e expirado; Pix e cartão; webhook inválido, duplicado e fora de ordem; pedido inexistente; valor adulterado; falha no `payment_check`; retorno do navegador sem webhook; estorno; confirmação depois da expiração da reserva; comprovante e baixa correta do estoque.

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

A quantidade disponível é exibida na listagem, na página do produto e na sacola. Produtos sem estoque são omitidos da vitrine pública. Ajustes feitos no painel são persistidos no banco e não retornam ao valor anterior após recarregar.

```bash
cd backend
./mvnw -Dtest=SecurityAndOrderIntegrationTests test
```

Manualmente, deixe uma unidade e execute dois checkouts simultâneos: somente um deve reservar. Cancelamento/expiração devolve a unidade; conclusão migra para vendida.

Faltam variantes, importação/exportação, alerta em canal real e devolução integrada ao reembolso.

## 6. Melhor Envio

**Estado: 🟡 implementado, dependente de homologação**

Há cotação no backend, OAuth por `authorization_code`, renovação por `refresh_token`, tokens protegidos, `User-Agent`, sandbox/produção, revalidação da cotação e retirada sem cotação. O fluxo “pronto para retirada” foi corrigido.

Peso, altura, largura e comprimento agora fazem parte do cadastro de cada produto, possuem validação no backend e são usados no payload de cotação. O painel sinaliza produtos ativos com estoque que ainda não possuem configuração física completa.

### Configurar

Client ID, client secret, redirect URI exata, User-Agent com contato, chave de criptografia, CEP de origem e ambiente. Sandbox e produção são independentes.

### Limitações

- os valores físicos reais ainda precisam ser preenchidos para todo o catálogo;
- variantes ainda não possuem dimensões próprias;
- o empacotamento de múltiplos produtos ainda depende da composição adotada pelo serviço de frete e precisa ser homologado com pedidos mistos;
- sandbox e produção possuem autorizações independentes.

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

**Estado: ✅ segurança administrativa implementada**

JWT, BCrypt, ADMIN, cookie `HttpOnly`, `Secure` em produção, `SameSite=Strict`, CSRF, expiração, CORS e bloqueio de login estão implementados. O token não fica no `localStorage` nem é devolvido no corpo do login.

O painel possui uma central compacta de avisos expansíveis para estoque, medidas de frete e outras pendências operacionais. O cadastro de produtos também mostra um aviso local quando o frete não está configurado. A tela de configurações informa se a InfinitePay está pronta ou aguardando configuração.

O painel de Segurança permite ativar e desativar 2FA TOTP, compatível com aplicativos autenticadores, listar dispositivos conectados, revogar uma sessão e encerrar todas as outras sessões. Segredos TOTP são criptografados no banco, cada JWT possui um identificador de sessão e sessões revogadas deixam de autorizar rotas protegidas.

Ainda faltam recuperação de senha, gestão de múltiplos administradores, códigos de recuperação do 2FA, renovação controlada e alertas externos de acesso.

Teste acesso sem cookie, alteração sem CSRF, origem não permitida, repetição de senha errada, código TOTP inválido, repetição de login em outro navegador e revogação do dispositivo atual.

## 10. HTTPS, headers e erros

**Estado: ✅ código; 🟡 proxy**

Existem handler central, mensagens genéricas, correlação, logs internos, HSTS, CSP, bloqueio de frames, Referrer-Policy, Permissions-Policy e configuração de HTTPS.

```bash
curl -I https://SEU_DOMINIO
curl -i https://SEU_DOMINIO/api/rota-inexistente
```

Não devem aparecer SQL, classes, caminhos, segredos ou stack trace. O proxy deve encaminhar corretamente o protocolo original.

## 11. Imagens

**Estado: 🟡 armazenamento por arquivo implementado; storage externo pendente**

Novas imagens de produtos, banner da home e página “Sobre” são enviadas como `multipart/form-data`, limitadas a 2 MB e aceitam apenas JPEG, PNG ou WebP com assinatura válida. O backend gera nomes UUID, impede travessia de diretório, grava o arquivo de forma atômica e salva no banco somente a URL.

As imagens são servidas por uma rota pública com tipo de conteúdo controlado e cache imutável de um ano. Imagens Base64 antigas são migradas automaticamente para arquivos na inicialização. Novos cadastros não aceitam mais Base64.

O diretório é configurado por `MEDIA_DIRECTORY`, a URL pública por `MEDIA_PUBLIC_BASE_URL` e a imagem Docker possui `/app/data/uploads` como volume. Esse volume precisa entrar no backup e ser persistente em qualquer implantação.

Para produção com múltiplas réplicas ainda faltam S3/R2 ou serviço compatível, upload assinado, CDN, remoção de metadados, redimensionamento, geração WebP/AVIF, imagens responsivas e limpeza automática de arquivos órfãos.

## 12. Segredos e banco

**Estado: ✅ configuração; 🟡 infraestrutura**

Produção exige credenciais externas, suporta TLS e desativa bootstrap automático de admin. Na implantação: banco privado, usuário exclusivo, senha forte, secret manager, rotação, chaves por ambiente e remoção do bootstrap. `postgres/postgres` só no desenvolvimento isolado.

## 13. Checkout e erros

**Estado: ✅ fluxo e tratamento de erros implementados**

Há revisão de produtos, valores, contato, endereço, entrega, frete, pagamento e termos, com edição, retry e preservação dos dados. Nome, e-mail, telefone, CEP, endereço, frete e aceite possuem mensagens específicas junto aos campos, `aria-invalid`, `aria-describedby` e foco automático no primeiro problema.

Falhas do CEP, Melhor Envio e criação do pedido permanecem visíveis, sem limpar a sacola. O teste E2E simula indisponibilidade temporária da API, confirma que os produtos continuam salvos e repete a confirmação até concluir. O checkout convidado permanece.

Ainda é necessário homologar o fluxo real completo com Melhor Envio e InfinitePay nos ambientes externos.

## 14. Sacola

**Estado: 🟡 boa base**

Há persistência, quantidades, disponibilidade, remover/desfazer, resumo, frete e aviso de frete grátis. Faltam sincronização, salvar para depois, aviso explícito de mudança de preço e variantes.

## 15. Comunicações transacionais

**Estado: ✅ infraestrutura; 🟡 homologação dos provedores**

Há outbox persistente para e-mail e WhatsApp, tentativas com backoff, falha definitiva, repetição manual, destinos mascarados no painel e links seguros com dados mínimos. Pedido criado/cobrança, pagamento/preparação, retirada, envio, rastreamento, conclusão, cancelamento e atualizações de estorno/pós-venda geram eventos.

O e-mail usa SMTP e o WhatsApp usa um webhook de provedor com payload mínimo (`to` e `message`). Enquanto um canal não possui credenciais, as mensagens ficam em `AWAITING_CONFIGURATION`, sem serem descartadas. Falta cadastrar remetente/domínio, contratar/homologar os provedores e testar entregabilidade, opt-out aplicável e templates aprovados do WhatsApp.

## 16. Cancelamento, troca e devolução

**Estado: ✅ processo implementado; 🟡 estorno externo**

O cliente pode abrir cancelamento, troca ou devolução validando pedido e contato/link seguro, informar motivo e detalhes, anexar até três imagens e receber protocolo com código de acompanhamento. O painel possui fila, prazo, status, mensagem ao cliente, controle de estorno e retorno idempotente dos itens ao estoque, com movimentação e auditoria.

O cancelamento aprovado altera o pedido e libera reservas. Devoluções recebidas podem retornar a venda baixada ao estoque uma única vez. O status do estorno é rastreado, mas a execução financeira automática ainda depende da API e das credenciais reais do provedor de pagamento.

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

Existem scripts de backup e restauração em `ops/`. O documento `POLITICA_BACKUP_INCIDENTES.md` não está presente no estado atual do repositório. Falta restaurar ou recriar a política, agendar, criptografar, copiar para fora, monitorar, testar restauração, definir responsáveis e formalizar incidentes.

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

Já cobre autenticação, criação segura, adulteração, produto inativo, estoque, persistência de ajuste manual, concorrência, idempotência, expiração, acompanhamento, rate limiting, CORS, headers, payload, frete, status, health e comportamento seguro da InfinitePay enquanto desativada.

Playwright cobre checkout em Chromium desktop e celular: erros por campo, foco, atributos acessíveis, retirada, revisão, termos, falha da API, preservação da sacola, retry e conclusão.

Faltam frontend unitário, axe, contrato, PostgreSQL/Testcontainers, testes automatizados do provedor e webhooks, cancelamento/reembolso, Melhor Envio controlado e smoke pós-deploy.

## 24. CI/CD

**Estado: ✅ CI; 🟡 deploy**

`.github/workflows/ci.yml` executa testes, lint, TypeScript, build, Playwright em Chromium, auditoria de produção, detecção de segredos e construção das imagens. O backend passou a usar Maven oficial no job e na imagem Docker, eliminando a dependência incorreta de um `mvnw` inexistente no contexto da imagem. Faltam provedor, ambientes, deploy aprovado, migrações, smoke e rollback ensaiado.

## 25. Observabilidade

**Estado: 🟡 instrumentação**

Há correlação, Actuator, Prometheus, métricas HTTP/JVM/banco, latência do Melhor Envio, pedidos presos e `ops/prometheus-alerts.yml`. O documento `OBSERVABILIDADE_E_CI.md` não está presente no estado atual do repositório.

Faltam coletor, dashboards, logs centralizados, uptime, canal de alertas, erros frontend, alertas de backup/webhooks e SLOs.

## 26. Funil

**Estado: 🟡 iniciado com privacidade**

Há eventos consentidos para produto, sacola, checkout, entrega, frete, pagamento selecionado e erro. Faltam plataforma, abandono, cobrança real, pagamento aprovado, conclusão, dashboards e política de retenção.

## 27. Prioridades

### P0 — antes de vendas reais

- [ ] configurar e homologar InfinitePay, incluindo Pix, cartão, webhooks, estorno e conciliação;
- [ ] dados empresariais e documentos legais reais;
- [ ] cadastrar medidas reais de todo o catálogo e homologar o Melhor Envio;
- [ ] domínio, HTTPS, segredos e banco privado;
- [ ] backup externo restaurado;
- [ ] monitoramento e alertas;
- [ ] E2E desktop/celular e auditoria de acessibilidade;
- [ ] compra completa de homologação.

### P1 — operação

- [ ] comunicações;
- [ ] cancelamento, troca, devolução e reembolso;
- [ ] migrar o diretório de imagens para S3/R2, adicionar CDN e variantes otimizadas;
- [ ] rate limiting distribuído;
- [ ] códigos de recuperação do 2FA e gestão de administradores;
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
- `frontend/src/routes/produtos_.$slug.tsx`
- `.github/workflows/ci.yml`
- `INFINITEPAY_CONFIGURACAO.md`
- `ops/backup-postgres.sh`
- `ops/prometheus-alerts.yml`

## Referências

- OWASP ASVS: <https://owasp.org/www-project-application-security-verification-standard/>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
- Decreto nº 7.962/2013: <https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm>
- ANPD: <https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-vf.pdf>
- Google Product: <https://developers.google.com/search/docs/appearance/structured-data/product>
- Google e-commerce: <https://developers.google.com/search/docs/specialty/ecommerce/how-to-launch-an-ecommerce-website>
- Baymard: <https://baymard.com/blog/ecommerce-checkout-usability-report-and-benchmark>
- Melhor Envio: <https://docs.melhorenvio.com.br/>
- InfinitePay: <https://www.infinitepay.io/checkout-documentacao>
