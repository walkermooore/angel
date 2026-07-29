# E-commerce full stack — projeto de portfólio

Aplicação completa de comércio eletrônico desenvolvida para uma loja de joias e cosméticos, com vitrine pública, checkout, gestão administrativa, estoque transacional, integrações externas e recursos de segurança e operação.

> **Status do projeto:** o desenvolvimento comercial foi encerrado porque o cliente desistiu de prosseguir com o projeto. O repositório foi preservado exclusivamente como portfólio técnico e material de estudo. Dados pessoais, contatos, credenciais e informações identificáveis do cliente foram removidos. A aplicação não representa uma loja em operação e não deve processar vendas reais sem nova configuração, revisão legal e homologação.

## Visão geral

O sistema é dividido em:

- frontend React com renderização no servidor e roteamento por arquivos;
- API REST em Java e Spring Boot;
- PostgreSQL com migrações versionadas pelo Flyway;
- painel administrativo protegido;
- serviços de pagamento, frete, imagens, notificações e pós-venda preparados para integração;
- mensageria assíncrona com RabbitMQ, outbox persistente e dead-letter queue;
- CI, testes automatizados, Docker e recursos de observabilidade.

## Funcionalidades implementadas

### Loja e catálogo

- Home administrável, banners, destaques e conteúdo institucional;
- catálogo com categorias, busca, filtros e produtos em destaque;
- página individual de produto com rota amigável;
- preço normal, desconto e apresentação de disponibilidade;
- quantidade disponível na listagem, no produto e na sacola;
- remoção automática de produtos sem estoque da vitrine pública;
- skeletons neutros durante o carregamento;
- conteúdo sempre consultado no backend, sem restauração de catálogo fictício;
- comportamento responsivo para desktop e dispositivos móveis.

### Sacola e checkout

- inclusão, remoção, alteração de quantidade e desfazer remoção;
- validação da quantidade contra o estoque disponível;
- persistência da sacola no navegador;
- resumo de subtotal, desconto, frete e total;
- formulário de contato, endereço, entrega e pagamento;
- consulta de CEP;
- revisão final antes da criação do pedido;
- mensagens de erro associadas aos campos e foco no primeiro erro;
- preservação da sacola e dos dados quando a API falha;
- nova tentativa segura;
- idempotência para impedir pedidos duplicados;
- recálculo autoritativo de preços e totais pelo backend.

### Pedidos e acompanhamento

- criação segura de pedidos;
- número público e token forte de acompanhamento;
- consulta por token ou confirmação de contato;
- DTO público reduzido, sem exposição do endereço completo;
- status de pagamento, preparação, envio, retirada, conclusão e cancelamento;
- código de rastreamento;
- retirada separada do fluxo de entrega;
- página pública “Meu Pedido” conectada diretamente à API;
- rate limiting contra enumeração de pedidos.

### Estoque

- quantidades disponível, reservada, vendida e mínima;
- movimentações auditáveis;
- ajuste manual persistido pelo painel;
- reserva transacional durante o checkout;
- bloqueio pessimista para concorrência;
- liberação automática de reservas expiradas;
- baixa após confirmação do pagamento;
- retorno ao estoque em cancelamentos e devoluções;
- operação idempotente para evitar devolução duplicada;
- teste concorrente para a última unidade.

### Frete

- integração preparada com o Melhor Envio;
- OAuth por código de autorização;
- renovação automática do token;
- armazenamento protegido das credenciais;
- ambientes de sandbox e produção separados;
- cotação calculada no backend;
- revalidação da cotação antes de criar o pedido;
- peso, altura, largura e comprimento por produto;
- aviso administrativo para produtos sem medidas;
- retirada sem dependência de cotação.

As credenciais não fazem parte do repositório. A integração exige uma nova conta e homologação antes de qualquer uso real.

### Pagamentos

- integração preparada com o checkout hospedado da InfinitePay;
- criação de cobrança com valores calculados pelo servidor;
- suporte estrutural para Pix e cartão;
- retorno seguro do navegador;
- webhook com confirmação ativa no provedor;
- validação de pedido, transação e valor;
- processamento idempotente de notificações repetidas;
- integração desativada por padrão.

Nenhuma credencial ou conta de pagamento está incluída. Cobranças e reembolsos reais exigem nova configuração e homologação.

### Cancelamento, troca e devolução

- abertura pública de solicitação;
- protocolo e código seguro;
- cancelamento, troca ou devolução;
- motivo, detalhes, prazo e anexos;
- acompanhamento pelo cliente;
- painel administrativo de análise;
- estados da solicitação e do estorno;
- notas administrativas;
- cancelamento do pedido e liberação de reserva;
- retorno de itens ao estoque;
- mensagens transacionais e auditoria.

### Comunicações transacionais

- fila persistente de saída;
- publicação assíncrona de IDs pelo RabbitMQ;
- exchange e filas duráveis;
- consumidor desacoplado dos eventos de pedido;
- processamento idempotente baseado no estado do outbox;
- retry persistido sem perder mensagens quando o broker está indisponível;
- dead-letter exchange e DLQ para falhas permanentes;
- prefetch e concorrência configuráveis;
- publisher confirms e retorno de mensagens;
- fallback local quando RabbitMQ está desativado;
- canais independentes de e-mail e WhatsApp;
- eventos de criação, cobrança, pagamento, preparação, retirada, envio, rastreamento, conclusão, cancelamento e pós-venda;
- mensagens com dados mínimos e links seguros;
- tentativas automáticas com atraso progressivo;
- reprocessamento administrativo;
- mascaramento dos destinatários no painel;
- estado “aguardando configuração” quando não há provedor.

SMTP e WhatsApp estão desativados por padrão e não contêm destinatários, tokens ou remetentes reais.

### Imagens

- upload multipart para produtos e conteúdos;
- validação de assinatura JPEG, PNG e WebP;
- limite de tamanho;
- nomes aleatórios;
- proteção contra travessia de diretório;
- escrita atômica;
- armazenamento da URL no banco, sem novos Base64;
- migração de imagens legadas;
- cache público imutável;
- diretório configurável e volume Docker.

Para múltiplas réplicas, o armazenamento local deve ser substituído por S3, R2 ou serviço equivalente.

### Painel administrativo

- dashboard e avisos operacionais expansíveis;
- CRUD de produtos e categorias;
- estoque e medidas de frete;
- pedidos, status e rastreamento;
- conteúdo da Home, Sobre, FAQ e páginas institucionais;
- destaques;
- pós-venda;
- comunicações pendentes;
- auditoria;
- configurações de integrações;
- central de segurança.

### Segurança

- autenticação administrativa;
- senha com BCrypt;
- JWT em cookie `HttpOnly`;
- `Secure` configurável e `SameSite=Strict`;
- CSRF;
- CORS restrito;
- Content Security Policy e outros headers;
- 2FA TOTP;
- segredo TOTP criptografado;
- sessões identificáveis e revogáveis;
- encerramento das demais sessões;
- rate limiting de login e APIs sensíveis;
- DTOs limitados e rejeição de campos desconhecidos;
- erros públicos sem stack trace ou detalhes internos;
- identificador de correlação;
- segredos exclusivamente por variáveis de ambiente.

### Privacidade e acessibilidade

- banner amigável de cookies;
- aceitar todos, somente necessários ou personalizar;
- categorias de preferências, analytics e marketing;
- consentimento revogável;
- eventos de funil condicionados ao consentimento;
- páginas de privacidade, cookies, termos e trocas;
- formulários com nomes acessíveis, mensagens associadas e estados anunciados;
- navegação responsiva.

Os textos institucionais presentes são demonstrações técnicas e precisam de revisão jurídica antes de reutilização comercial.

### SEO e operação

- metadados por rota;
- canonical;
- Open Graph;
- JSON-LD;
- sitemap, robots e feed de produtos;
- endpoints Actuator;
- métricas Prometheus;
- correlação de logs;
- health checks;
- scripts de backup e restauração;
- imagens Docker para frontend e backend.

## Tecnologias

### Frontend

- React 19;
- TypeScript;
- TanStack Start e TanStack Router;
- TanStack Query;
- Vite;
- Tailwind CSS;
- Radix UI e componentes shadcn;
- React Hook Form e Zod;
- Playwright;
- ESLint.

### Backend

- Java 21;
- Spring Boot;
- Spring MVC;
- Spring Data JPA;
- Spring Security;
- PostgreSQL;
- Flyway;
- Maven;
- JUnit, MockMvc e H2 para testes;
- Docker Compose.
- RabbitMQ.

## Arquitetura resumida

```text
Navegador
   │
   ├── Frontend React / TanStack Start
   │       ├── loja pública
   │       └── painel administrativo
   │
   └── API Spring Boot
           ├── autenticação e segurança
           ├── catálogo, estoque e pedidos
           ├── pagamento e frete
           ├── pós-venda e comunicações
           ├── PostgreSQL + Flyway (outbox)
           └── RabbitMQ
                   ├── angell.notifications.dispatch
                   └── angell.notifications.dead (DLQ)
```

## Como executar localmente

### Pré-requisitos

- Java 21;
- Node.js e npm;
- Docker e Docker Compose;
- portas `5173`, `8081`, `5435`, `5672` e `15672` disponíveis.

### 1. Variáveis de ambiente

Use os arquivos de exemplo:

- [`backend/.env.example`](./backend/.env.example)
- [`frontend/.env.example`](./frontend/.env.example)

Crie valores exclusivamente locais. Não reutilize credenciais pessoais e não versione arquivos `.env`.

Variáveis mínimas do backend:

```env
JWT_SECRET=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
ADMIN_INITIAL_EMAIL=admin@example.invalid
ADMIN_INITIAL_PASSWORD=defina-uma-senha-local-forte
ADMIN_INITIAL_NAME=Administrador
CORS_ALLOWED_ORIGINS=http://localhost:5173
RABBITMQ_ENABLED=true
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=portfolio
RABBITMQ_PASSWORD=portfolio-local
```

Frontend:

```env
VITE_API_URL=http://localhost:8081/api
```

### 2. PostgreSQL e RabbitMQ

```bash
cd backend
docker compose up -d
```

O Compose inicia:

- PostgreSQL em `localhost:5435`;
- RabbitMQ/AMQP em `localhost:5672`;
- painel de gerenciamento RabbitMQ em `http://localhost:15672`.

As credenciais `portfolio` / `portfolio-local` existem somente para desenvolvimento local. Defina usuários e senhas próprios fora do repositório em qualquer ambiente compartilhado.

### Como funciona a mensageria

1. O evento de pedido grava uma comunicação na tabela `notification_outbox`.
2. O agendador seleciona registros pendentes e publica somente o UUID na exchange `angell.notifications`.
3. A fila durável `angell.notifications.dispatch` entrega o UUID ao consumidor.
4. O consumidor consulta a mensagem no PostgreSQL e envia pelo canal configurado.
5. Sucesso muda o registro para `SENT`.
6. Falha temporária muda para `RETRY`, com nova tentativa progressiva.
7. Depois do limite de tentativas, o registro fica `FAILED` e um resumo técnico vai para `angell.notifications.dead`.

O conteúdo sensível não precisa trafegar pelo broker: destinatário, mensagem e link seguro permanecem no banco. Se o RabbitMQ estiver desligado, o mesmo outbox é processado diretamente pelo agendador.

### 3. Backend

```bash
cd backend
set -a
source .env
set +a
./mvnw spring-boot:run
```

A API fica disponível em `http://localhost:8081`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

A interface fica disponível em `http://localhost:5173`.

## Testes e validação

Backend:

```bash
cd backend
./mvnw test
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

O CI executa testes, lint, TypeScript, build, Playwright, verificação de segredos e construção das imagens.

## Limitações conhecidas

- integrações externas não estão configuradas;
- não existe ambiente de produção ativo;
- dados empresariais e contatos foram removidos;
- textos jurídicos são apenas uma base demonstrativa;
- estorno financeiro depende da API e da conta do provedor;
- storage externo/CDN não foi concluído;
- observabilidade e backups precisam ser implantados em infraestrutura;
- variantes de produto ainda não foram implementadas;
- o projeto não recebe manutenção comercial.

## Uso como portfólio

Este repositório demonstra decisões de arquitetura, segurança, consistência transacional, tratamento de falhas, experiência administrativa e integração entre frontend e backend.

O código pode ser estudado e adaptado respeitando a licença e os direitos aplicáveis aos seus componentes. A identidade, os dados e o relacionamento comercial do cliente original não fazem parte deste portfólio.

## Documentação complementar

- [`AUDITORIA_ECOMMERCE.md`](./AUDITORIA_ECOMMERCE.md)
- [`DOCUMENTACAO_PROJETO.md`](./DOCUMENTACAO_PROJETO.md)
- [`MELHOR_ENVIO_CONFIGURACAO.md`](./MELHOR_ENVIO_CONFIGURACAO.md)
- [`INFINITEPAY_CONFIGURACAO.md`](./INFINITEPAY_CONFIGURACAO.md)
