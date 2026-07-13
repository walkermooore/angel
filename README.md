# Angel Beauty Gems — Joias & Cosméticos

Este é o repositório principal do projeto **Angel**, um e-commerce minimalista de joias em prata 925 e cosméticos selecionados. O projeto é composto por uma aplicação web no frontend integrada com uma API robusta no backend.

---

## 📁 Estrutura do Repositório

O projeto é dividido em dois módulos principais:

*   **[frontend/](frontend/)**: Interface de e-commerce e painel administrativo desenvolvida em **React**, **Vite** e **TypeScript**.
*   **[backend/](backend/)**: API REST desenvolvida em **Java 21** e **Spring Boot** com banco de dados **PostgreSQL** para persistência de dados.

---

## 🖥️ Módulo Frontend

O frontend oferece uma experiência de compra moderna e fluida, além de um painel de controle administrativo completo para gerenciamento de vendas.

### Principais Tecnologias:
*   React & TypeScript
*   Vite (Ferramenta de build rápida)
*   TanStack Router (Roteamento baseado em arquivos)
*   Tailwind CSS & shadcn/ui (Estilização e componentes de UI)
*   TanStack Query (Gerenciamento de requisições e cache de APIs)

### Como Executar o Frontend:
1.  Acesse o diretório do frontend:
    ```bash
    cd frontend
    ```
2.  Instale as dependências (o projeto utiliza o gerenciador de pacotes **Bun**):
    ```bash
    bun install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    bun dev
    ```
    A aplicação estará disponível em **`http://localhost:5173`**.

---

## ⚙️ Módulo Backend

O backend fornece a lógica de negócios, endpoints de consulta de produtos, persistência e atualização dos status de pedidos.

### Principais Tecnologias:
*   Java 21 (LTS)
*   Spring Boot 3.x
*   Spring Data JPA (Camada de persistência ORM)
*   PostgreSQL (Banco de dados relacional principal)
*   Docker Compose (Orquestração do banco de dados local)
*   Lombok (Anotações utilitárias)

### Como Executar o Backend:

#### 1. Iniciar o Banco de Dados (PostgreSQL)
Você pode subir a instância do PostgreSQL localmente de forma rápida utilizando o Docker Compose configurado em [backend/docker-compose.yml](backend/docker-compose.yml):
```bash
cd backend
docker compose up -d
```
*   **Banco de Dados:** `angeldb`
*   **Porta:** `5432`
*   **Usuário/Senha:** `postgres` / `postgres`

#### 2. Iniciar a Aplicação Spring Boot
Com o banco de dados ativo, inicialize o servidor utilizando o JDK 21 portátil configurado no projeto através do script de atalho [backend/run.sh](backend/run.sh):
```bash
cd backend
./run.sh
```
A API estará acessível em **`http://localhost:8080`**.

