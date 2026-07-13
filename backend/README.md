# Angel Beauty Gems — Backend (Guia de Aprendizado Spring Boot)

Seja bem-vindo(a) ao backend do projeto **Angel**! Esta pasta foi limpa e configurada para servir como o ponto de partida do seu aprendizado prático com **Spring Boot**. Todas as dependências necessárias, o banco de dados **PostgreSQL** e a estrutura básica do projeto já estão configurados.

---

## 🛠️ Tecnologias Pré-Configuradas
*   **Java 21** (usando o JDK local e portátil na pasta `.jdk/`)
*   **Spring Boot 3.x**
*   **Spring Data JPA** (Camada de persistência ORM)
*   **PostgreSQL Driver** (Conector para o banco de dados)
*   **Lombok** (Para evitar escrever manualmente Getters, Setters, construtores, etc.)

---

## 🚀 Como Executar a Base do Projeto
Para rodar a aplicação e iniciar os seus testes, você pode usar o script de inicialização que aponta para o JDK portátil do projeto:

```bash
./run.sh
```

A aplicação subirá na porta **`8080`**.

### Configuração do Banco de Dados (PostgreSQL)
Certifique-se de que o seu serviço PostgreSQL está ativo e possui o banco de dados correspondente criado.
No arquivo [application.properties](backend/src/main/resources/application.properties), as configurações padrão são:

*   **URL:** `jdbc:postgresql://localhost:5432/angeldb`
*   **User Name:** `postgres`
*   **Password:** `postgres`

*Dica:* Se precisar usar credenciais diferentes, basta alterá-las no arquivo [application.properties](backend/src/main/resources/application.properties).

---

## 🗺️ Passo a Passo Sugerido para Desenvolvimento

Aqui está um roteiro para você guiar a construção manual da sua aplicação:

### Passo 1: Criar o Modelo de Domínio (Entities)
Crie o pacote `com.angel.backend.model` (ou `domain`) e implemente as classes anotadas com `@Entity` do JPA:
1.  **`Product`**: Deve conter as propriedades do produto:
    *   `id` (String ou UUID)
    *   `name` (String)
    *   `price` (Double)
    *   `category` (String - ex: "prata", "cosmeticos")
    *   `image` (String)
    *   `description` (String)
2.  **`Address`**: Crie como uma classe anotada com `@Embeddable` (embutível) ou como entidade separada:
    *   `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`.
3.  **`OrderItem`**: Classe anotada com `@Embeddable` contendo:
    *   `productId`, `name`, `price`, `quantity`, `image`.
4.  **`Order`**: Entidade contendo:
    *   `id` (String ou UUID)
    *   `number` (String - código único do pedido, ex: `ANG-20260713-1234`)
    *   `email` (String)
    *   `createdAt` (String ou LocalDateTime)
    *   `items` (Uma lista `@ElementCollection` de `OrderItem`)
    *   `subtotal`, `shipping`, `total` (Double)
    *   `status` (String - ex: "Pendente", "Pago", "Enviado", "Concluído")
    *   `payment` (String - ex: "PIX", "Cartão", "Boleto")
    *   `address` (A classe `Address` embutida via `@Embedded`)

### Passo 2: Criar os Repositórios (Repositories)
Crie o pacote `com.angel.backend.repository` e declare as interfaces de persistência estendendo `JpaRepository`:
1.  **`ProductRepository`** estendendo `JpaRepository<Product, String>`
2.  **`OrderRepository`** estendendo `JpaRepository<Order, String>`

### Passo 3: Implementar a Camada de Serviço (Services) - *Opcional mas recomendado*
Crie o pacote `com.angel.backend.service` para isolar a lógica de negócio dos Controllers:
*   Implemente regras de validação (ex: e-mail obrigatório, CEP válido).
*   Geração do código de rastreio/número do pedido (ex: `ANG-` + data atual + número aleatório).

### Passo 4: Criar os Controladores REST (Controllers)
Crie o pacote `com.angel.backend.controller` para expor as APIs HTTP:
1.  **`ProductController`** mapeado para `/api/products`:
    *   `GET /api/products` (Listar todos os produtos)
    *   `POST /api/products` (Criar um novo produto - gerar ID se nulo)
    *   `PUT /api/products/{id}` (Editar produto existente)
    *   `DELETE /api/products/{id}` (Deletar produto)
2.  **`OrderController`** mapeado para `/api/orders`:
    *   `GET /api/orders` (Listar todos os pedidos)
    *   `POST /api/orders` (Criar um pedido)
    *   `PUT /api/orders/{id}/status` (Atualizar status de um pedido específico para Pendente, Pago, Enviado ou Concluído)

### Passo 5: Configurar o CORS (Cross-Origin Resource Sharing)
Para que a sua aplicação React (frontend) rodando localmente (normalmente em `http://localhost:5173`) consiga consumir a API REST na porta `8080`, você precisará habilitar o CORS.
*   *Dica:* Crie uma classe de configuração no pacote `com.angel.backend.config` implementando `WebMvcConfigurer` ou use a anotação `@CrossOrigin(origins = "*")` diretamente nos seus Controllers.

### Passo 6: Popular o Banco de Dados com Dados Iniciais (Seed)
Crie uma classe com a anotação `@Component` que implemente a interface `CommandLineRunner` do Spring Boot. No método `run`, insira alguns produtos mockados no `ProductRepository` caso a tabela esteja vazia, facilitando a visualização inicial no frontend.
