# 🌟 Angel — Joias de Prata & Cosméticos

Bem-vindo ao repositório do **Angel**, um e-commerce minimalista e sofisticado desenvolvido para a venda de joias em prata 925 e cosméticos selecionados. 

Este projeto foi projetado com uma arquitetura moderna, dividida de forma limpa entre uma aplicação web (Single Page Application com SSR via TanStack Start) no frontend e uma API REST robusta em Spring Boot no backend.

---

## 📁 Estrutura do Repositório

O projeto está organizado de forma modular para facilitar o desenvolvimento independente de cada stack:

*   📂 **[frontend/](./frontend)**: Interface do usuário (E-commerce) e Painel Administrativo de controle de vendas. Desenvolvido com **React**, **Vite**, **TypeScript** e **TanStack Start**.
*   📂 **[backend/](./backend)**: API RESTful responsável pelas regras de negócio, persistência de dados e endpoints de produtos/pedidos. Desenvolvido em **Java 21** com **Spring Boot 3.x** e banco de dados **PostgreSQL**.

---

## 🖥️ Módulo Frontend

A interface do usuário do **Angel** prioriza a performance, usabilidade e design sofisticado. Inclui a jornada de compra completa (vitrine de produtos, carrinho dinâmico, checkout) e um dashboard administrativo para gestão de vendas e estoque.

### 🛠️ Tecnologias Principais
*   **React 19 & TypeScript**: Componentização moderna e tipagem estática segura.
*   **TanStack Start & Router**: Roteamento baseado em arquivos com Server-Side Rendering (SSR) híbrido de alta performance.
*   **Tailwind CSS (v4) & shadcn/ui**: Estilização baseada em utilitários e componentes acessíveis e elegantes.
*   **TanStack Query**: Gerenciamento inteligente de estado assíncrono, cache e requisições HTTP.
*   **Lucide React**: Biblioteca de ícones vetoriais modernos.

### 🚀 Como Inicializar o Frontend
1. Acesse o diretório correspondente:
   ```bash
   cd frontend
   ```
2. Instale as dependências utilizando o gerenciador de pacotes **npm**:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Módulo Backend

O backend fornece todos os serviços e persistência de dados necessários para suportar o e-commerce.

### 🛠️ Tecnologias Principais
*   **Java 21 (LTS)**: Utilização dos recursos mais modernos da linguagem.
*   **Spring Boot 3.x**: Framework ágil para criação de APIs empresariais.
*   **Spring Data JPA**: Abstração de persistência ORM sobre o Hibernate.
*   **PostgreSQL**: Banco de dados relacional robusto e escalável.
*   **MapStruct**: Mapeamento seguro de DTOs e entidades com alta performance.
*   **Docker & Docker Compose**: Containerização simplificada do banco de dados local.

### 🚀 Como Inicializar o Backend

> [!NOTE]
> Certifique-se de ter o Docker instalado e rodando em sua máquina antes de iniciar os serviços do banco de dados.

#### 1. Iniciar o Banco de Dados (PostgreSQL)
Acesse a pasta do backend e suba o container do banco de dados:
```bash
cd backend
docker compose up -d
```
O banco de dados estará disponível localmente na porta `5432` com as seguintes credenciais padrão:
*   **Database:** `angeldb`
*   **User/Password:** `postgres` / `postgres`

#### 2. Executar a API Spring Boot
Com o banco ativo, execute o script utilitário para compilar e subir o servidor utilizando a JDK portátil configurada no projeto:
```bash
cd backend
./run.sh
```
A API estará acessível em [http://localhost:8080](http://localhost:8080).

---

## 🔒 Painel Administrativo
O e-commerce conta com uma seção administrativa integrada no frontend para o controle de pedidos e estoque:
*   Acesse a rota `/admin` para visualizar o dashboard.
*   Gerenciamento de produtos (listar, criar, editar e excluir).
*   Visualização de pedidos (detalhes de entrega, itens e atualização de status de pagamento/envio).

---
Desenvolvido com carinho para o projeto **Angel**.
