# ⚙️ Angel API — Backend Spring Boot

O backend do projeto **Angel** é uma API RESTful robusta desenvolvida em **Java 21** e **Spring Boot 3.x**. É responsável por gerenciar a lógica de negócios, persistir informações dos produtos e gerenciar o processamento de pedidos do e-commerce.

---

## 🛠️ Stack Tecnológica

*   **Java 21 (LTS)**: Aproveitando as melhorias de performance e sintaxe mais moderna.
*   **Spring Boot 3.x**: Estrutura principal da aplicação REST.
*   **Spring Data JPA**: Abstração de persistência sobre o Hibernate para operações de banco de dados.
*   **PostgreSQL**: Banco de dados relacional principal usado para produção e desenvolvimento local.
*   **Docker & Docker Compose**: Containerização fácil para rodar o banco de dados PostgreSQL sem a necessidade de instalação local.
*   **MapStruct**: Biblioteca utilitária para mapeamento de DTOs e Entidades em tempo de compilação.
*   **Lombok**: Redução de boilerplate para Getters, Setters, Construtores e Builders.
*   **Jakarta Validation**: Validação declarativa dos payloads recebidos no Controller.

---

## 🚀 Como Iniciar a API Localmente

### 1. Pré-requisitos
*   **Docker** e **Docker Compose** instalados e em execução.
*   **JDK 21** configurada na sua máquina (caso prefira rodar diretamente via IDE).

### 2. Inicializar o Banco de Dados (PostgreSQL)
A API depende do banco relacional PostgreSQL para persistência. Suba o container Docker pré-configurado:
```bash
docker compose up -d
```
Isso iniciará o banco com as seguintes configurações (definidas em `docker-compose.yml` e `src/main/resources/application.properties`):
*   **Database URL:** `jdbc:postgresql://angel:5433/angeldb`
*   **Username:** `postgres`
*   **Password:** `postgres`

### 3. Executar o Servidor Spring Boot
Você pode executar o projeto usando a IDE de sua preferência (como IntelliJ IDEA ou Eclipse) ou usar o script utilitário incluído na raiz do backend:
```bash
./run.sh
```
O script compilará a aplicação e iniciará o servidor na porta **`8080`**.

---

## 🗺️ Estrutura de Pacotes

A aplicação está organizada de acordo com as melhores práticas arquiteturais do ecossistema Spring:

```text
com.angel.backend
├── controller   # Camada REST (Endpoints HTTP)
├── dto          # Objetos de Transferência de Dados (Payloads de entrada/saída)
├── enums        # Categorias de Produtos, Status de Pedidos e Formas de Pagamento
├── mapper       # Interfaces MapStruct para conversão de DTOs/Entities
├── model        # Entidades JPA (Mapeamento do Banco de Dados)
├── repository   # Interfaces JPA Repository (Acesso ao Banco de Dados)
└── service      # Regras de Negócio e Serviços da Aplicação
```

---

## 🔌 API Endpoints (Produtos)

Abaixo estão detalhados os endpoints da API para o gerenciamento de produtos (mapeados em [ProductController](./src/main/java/com/angel/backend/controller/ProductController.java)):

### 1. Listar Produtos
*   **Endpoint:** `GET /api/produtos`
*   **Descrição:** Retorna a lista de todos os produtos cadastrados no sistema.
*   **Resposta (HTTP 200 OK):**
    ```json
    [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Anel de Prata Minimalista",
        "description": "Anel confeccionado em prata de lei 925 com acabamento polido.",
        "price": 129.90,
        "category": "PRATA",
        "image": "anel_prata.jpg"
      }
    ]
    ```

### 2. Criar Produto
*   **Endpoint:** `POST /api/produtos`
*   **Descrição:** Cadastra um novo produto no estoque.
*   **Corpo da Requisição (JSON):**
    ```json
    {
      "name": "Batom Hidratante Angel Rose",
      "description": "Batom com fórmula vegana e hidratação profunda.",
      "price": 49.90,
      "category": "COSMETICOS",
      "image": "batom_rose.jpg"
    }
    ```
*   **Resposta (HTTP 201 Created):** Retorna o produto criado, contendo o ID gerado automaticamente.

### 3. Atualizar Produto
*   **Endpoint:** `PUT /api/produtos/{id}`
*   **Descrição:** Atualiza as informações de um produto existente com base no UUID informado na URL.
*   **Corpo da Requisição (JSON):**
    ```json
    {
      "name": "Batom Hidratante Angel Rose Gold",
      "description": "Batom com acabamento cintilante e fórmula vegana.",
      "price": 54.90,
      "category": "COSMETICOS",
      "image": "batom_rose_gold.jpg"
    }
    ```

---

## 📈 Próximos Passos de Desenvolvimento (Pedidos)

Para estender os recursos da API e conectá-la ao carrinho de compras do frontend, devem ser implementados os fluxos de Pedidos (`PurchaseOrder`):
1.  **Repository**: Mapear [PurchaseOrderRepository](./src/main/java/com/angel/backend/repository/PurchaseOrderRepository.java) para persistência de pedidos.
2.  **OrderService**: Lógica para criação de pedidos (geração automática do código único do pedido, ex: `ANG-YYYYMMDD-XXXX`, e cálculo de taxas/frete).
3.  **OrderController**: Endpoint `POST /api/pedidos` para recebimento e processamento de compras do checkout, e `PUT /api/pedidos/{id}/status` para controle administrativo dos status de pagamento/envio.
