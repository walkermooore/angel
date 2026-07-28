# Angel — e-commerce e painel administrativo

O Angel é um e-commerce de joias em prata 925 e cosméticos, composto por:

- loja pública, catálogo, busca, sacola, checkout e acompanhamento de pedidos;
- painel administrativo para produtos, categorias, pedidos, auditoria e conteúdo;
- API REST Spring Boot protegida por JWT;
- PostgreSQL com schema controlado por Flyway.

A documentação funcional e técnica completa está em [DOCUMENTACAO_PROJETO.md](./DOCUMENTACAO_PROJETO.md).

## Implementações realizadas

### Pedidos e rastreamento

- Corrigida a persistência dos status `Pago`, `Enviado` e `Pronto para Retirada`.
- Criado o enum independente `PRONTO_PARA_RETIRADA`; ele não é mais gravado como `ENVIADO`.
- Normalização consistente dos valores de status recebidos da API.
- O painel aguarda e verifica a resposta do backend ao salvar.
- Em caso de erro, a alteração otimista local é revertida e uma mensagem é exibida.
- O código de rastreio é persistido por endpoint próprio.
- A página Meu Pedido consulta diretamente a API pelo número do pedido, evitando exibir cache desatualizado.
- Criado índice único para `purchase_order.number`.

### Páginas institucionais

- Criada a entidade e tabela `institutional_settings`.
- Criados endpoints público de leitura e administrativo de atualização.
- Adicionada a opção **Textos e Políticas** em **Configurações de Tela**.
- Termos de Uso, Trocas e Devoluções e Política de Privacidade agora são editáveis.
- Os textos são persistidos no PostgreSQL.
- O conteúdo é renderizado como texto, sem inserção de HTML arbitrário.

### Painel administrativo

- O conteúdo administrativo não é montado antes da checagem de autenticação.
- Removido o formulário que expunha/preenchia credenciais de demonstração.
- O login só cria a sessão local após uma resposta válida do backend.
- O frontend envia `Authorization: Bearer <token>` nas requisições.

### Segurança do backend

- Adicionados Spring Security e OAuth2 Resource Server.
- Implementado JWT stateless assinado com HMAC SHA-256.
- Tokens possuem emissor, assunto, nome, escopo `ADMIN`, emissão e expiração.
- Todos os endpoints não explicitamente públicos exigem o escopo `ADMIN`.
- O endpoint `/api/auth/me` identifica o administrador pelo assunto do JWT.
- Eliminado o fallback fixo `admin@example.invalid/admin123`.
- Eliminada a aceitação/migração automática de senhas em texto puro.
- Senhas administrativas são verificadas com BCrypt.
- A aplicação exige um segredo JWT de implantação com pelo menos 32 caracteres.

### Criação controlada do primeiro administrador

O administrador inicial só é criado quando `ADMIN_INITIAL_EMAIL` e `ADMIN_INITIAL_PASSWORD` são fornecidos. A senha precisa ter pelo menos 12 caracteres e é salva com BCrypt.

Se o e-mail já existir, o inicializador não sobrescreve nome ou senha. Depois da primeira inicialização, as variáveis de bootstrap podem ser removidas do ambiente.

### CORS

- Removida a configuração permissiva com origem `*`.
- As origens aceitas vêm de `CORS_ALLOWED_ORIGINS`.
- Métodos e cabeçalhos permitidos são declarados explicitamente.
- Credenciais por cookie cross-origin permanecem desabilitadas, pois a API usa Bearer token.

### Migrações e banco

- Substituído `spring.jpa.hibernate.ddl-auto=update` por `validate`.
- Adicionado Flyway com suporte específico ao PostgreSQL.
- `V1__initial_schema.sql` cria o schema inicial.
- `V2__secure_orders_and_institutional_pages.sql` adiciona a unicidade do pedido e garante a tabela de políticas.
- `baseline-on-migrate=true` permite incorporar uma base antiga sem histórico Flyway; ela é marcada como versão 1 e recebe a V2.

### Configuração do frontend

- A URL da API usa `VITE_API_URL`.
- O valor padrão de desenvolvimento continua sendo `http://localhost:8081/api`.
- Pedidos fictícios não entram no bundle/estado inicial de produção.
- Uma lista vazia persistida não é mais substituída por dados de demonstração.

### Testes

Foi criada uma suíte de integração com Spring Boot, MockMvc, Flyway e H2 em modo PostgreSQL. Ela verifica:

- login correto;
- rejeição de credenciais inválidas;
- bloqueio de endpoint administrativo sem JWT;
- acesso administrativo com JWT;
- alteração e persistência de status;
- alteração e persistência de código de rastreio;
- atualização autenticada das políticas;
- leitura pública das políticas;
- aplicação das migrações e validação do schema pelo Hibernate.

## Endpoints públicos e protegidos

### Públicos

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/api/auth/login` | Autenticação. |
| POST | `/api/pedidos` | Criação de pedido no checkout. |
| GET | `/api/pedidos/{idOuNumero}` | Acompanhamento individual. |
| GET | `/api/produtos` | Catálogo. |
| GET | `/api/categorias` | Categorias. |
| GET | `/api/destaques` | Destaques. |
| GET | `/api/faq` | FAQ. |
| GET | `/api/home-settings` | Conteúdo da Home. |
| GET | `/api/sobre-nos` | Conteúdo Sobre. |
| GET | `/api/paginas-institucionais` | Termos e políticas. |

### Administrativos

Todo endpoint restante exige:

```http
Authorization: Bearer <jwt>
```

Isso inclui listagem geral de pedidos, alteração de status/rastreio, CRUD de produtos/categorias/FAQ, destaques, auditoria e atualização de conteúdos.

## Tecnologias principais

### Frontend

- React 19 e TypeScript;
- TanStack Start e TanStack Router;
- Vite 8;
- Tailwind CSS 4;
- Radix UI/shadcn;
- React Hook Form, Zod, Lucide e Sonner.

### Backend

- Java 21;
- Spring Boot 4.1;
- Spring MVC e Spring Data JPA;
- Spring Security e OAuth2 Resource Server;
- JWT HMAC SHA-256;
- BCrypt;
- Flyway;
- PostgreSQL 17;
- H2 para testes;
- Maven e Docker Compose.

## Pré-requisitos

- Java 21;
- Node.js compatível com Vite 8;
- npm;
- Docker e Docker Compose, ou PostgreSQL 17 disponível;
- porta `5435` disponível para o banco local;
- porta `8081` disponível para a API.

## Configuração

Arquivos de referência:

- [backend/.env.example](./backend/.env.example)
- [frontend/.env.example](./frontend/.env.example)

### Variáveis do backend

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `JWT_SECRET` | Sim | Segredo aleatório com no mínimo 32 caracteres. |
| `JWT_EXPIRATION` | Não | Duração ISO-8601; padrão `PT8H`. |
| `ADMIN_INITIAL_EMAIL` | Só no bootstrap | E-mail do primeiro administrador. |
| `ADMIN_INITIAL_PASSWORD` | Só no bootstrap | Senha inicial, mínimo 12 caracteres. |
| `ADMIN_INITIAL_NAME` | Não | Nome do primeiro administrador. |
| `CORS_ALLOWED_ORIGINS` | Não | Origens separadas por vírgula; padrão `http://localhost:5173`. |
| `TRANSACTIONAL_EMAIL_ENABLED` | Não | Ativa o envio real por SMTP depois que as credenciais estiverem configuradas. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Para e-mail | Credenciais do provedor SMTP transacional. |
| `TRANSACTIONAL_EMAIL_FROM` | Para e-mail | Remetente verificado no provedor. |
| `TRANSACTIONAL_WHATSAPP_ENABLED` | Não | Ativa a entrega pelo webhook do provedor oficial de WhatsApp. |
| `WHATSAPP_WEBHOOK_URL`, `WHATSAPP_API_TOKEN` | Para WhatsApp | Endpoint e token do provedor; o payload enviado contém `to` e `message`. |
| `NOTIFICATIONS_PUBLIC_URL` | Não | URL pública usada nos links seguros de pedido e pós-venda. |

Exemplo de desenvolvimento:

```bash
export JWT_SECRET='gere-um-segredo-local-com-mais-de-32-caracteres'
export ADMIN_INITIAL_EMAIL='seu-admin@example.com'
export ADMIN_INITIAL_PASSWORD='uma-senha-local-forte'
export ADMIN_INITIAL_NAME='Administrador'
export CORS_ALLOWED_ORIGINS='http://localhost:5173'
```

Não versione valores reais. Em produção, forneça-os pelo gerenciador de segredos da plataforma.

### Variável do frontend

```bash
VITE_API_URL=http://localhost:8081/api
```

No Vite, variáveis `VITE_*` fazem parte do bundle público. Nunca coloque segredos nelas.

## Como executar

### 1. Banco

```bash
cd backend
docker compose up -d
```

O PostgreSQL é publicado em `localhost:5435`, banco `angeldb`, usuário e senha locais `postgres`.

### 2. Backend

Com as variáveis exportadas:

```bash
cd backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8081`.

Na primeira execução de uma base vazia, Flyway aplica V1 e V2. Em uma base antiga sem `flyway_schema_history`, `baseline-on-migrate` registra a versão inicial e aplica a V2.

Antes de aplicar a V2 em uma base existente, confira números duplicados:

```sql
SELECT number, COUNT(*)
FROM purchase_order
WHERE number IS NOT NULL
GROUP BY number
HAVING COUNT(*) > 1;
```

Se houver duplicatas, elas precisam ser corrigidas de forma consciente antes que o índice único possa ser criado.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Comandos de validação

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
./mvnw test
```

Resultados obtidos na implementação:

- build frontend cliente + SSR: aprovado;
- 3 testes de integração backend: aprovados;
- 0 falhas e 0 erros;
- duas migrações Flyway aplicadas no banco de teste;
- schema validado pelo Hibernate.

## Estrutura dos arquivos adicionados

```text
backend/
├── .env.example
├── src/main/java/com/angel/backend/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── InitialAdminConfig.java
│   ├── controller/InstitutionalSettingsController.java
│   ├── model/InstitutionalSettings.java
│   ├── repository/InstitutionalSettingsRepository.java
│   └── service/JwtService.java
├── src/main/resources/db/migration/
│   ├── V1__initial_schema.sql
│   └── V2__secure_orders_and_institutional_pages.sql
└── src/test/
    ├── java/.../SecurityAndOrderIntegrationTests.java
    └── resources/application-test.properties

frontend/
├── .env.example
└── src/
    ├── components/InstitutionalContent.tsx
    └── lib/institutionalStore.ts
```

## Observações de segurança

- O JWT no frontend é armazenado em `localStorage`. O backend está protegido, mas uma evolução recomendada é usar cookie `HttpOnly`, `Secure` e `SameSite` com proteção CSRF, reduzindo o impacto de XSS.
- A consulta pública de pedido por número expõe dados do pedido para quem possuir/adivinhar esse número. Para produção, recomenda-se um token público de rastreamento forte ou validação adicional.
- O endpoint de criação de pedido deve receber rate limiting e validações de payload antes de exposição pública.
- Restrinja `CORS_ALLOWED_ORIGINS` aos domínios exatos de produção.
- Use HTTPS em produção.
