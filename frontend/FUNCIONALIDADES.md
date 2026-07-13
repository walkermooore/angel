# Mapa de Funcionalidades do Sistema — Angel (Joias & Cosméticos)

Este documento mapeia todas as funcionalidades implementadas no sistema **Angel**, um e-commerce minimalista de joias em prata 925 e cosméticos. O projeto está estruturado utilizando **Vite**, **React**, **TypeScript**, **Tailwind CSS**, **TanStack Router**, **TanStack Query** e **shadcn/ui**.

---

## Sumário
1. [Estrutura Geral e Layout Base](#1-estrutura-geral-e-layout-base)
2. [Área Pública (E-commerce)](#2-área-pública-e-commerce)
3. [Processo de Compra (Checkout)](#3-processo-de-compra-checkout)
4. [Área Administrativa (Painel de Controle)](#4-área-administrativa-painel-de-controle)
5. [Gerenciamento de Dados, Estado e Persistência](#5-gerenciamento-de-dados-estado-e-persistência)

---

## 1. Estrutura Geral e Layout Base

A interface pública do sistema possui componentes estruturais globais definidos no arquivo de rota raiz [src/routes/__root.tsx](frontend/src/routes/__root.tsx).

### Componentes de Layout Global:
*   **Cabeçalho (Header)** ([src/components/Header.tsx](frontend/src/components/Header.tsx)):
    *   Navegação responsiva entre as páginas principais (**Home**, **Produtos**, **Sobre Nós**).
    *   Botão de busca rápida que abre a janela de pesquisa.
    *   Botão de sacola de compras com indicador numérico (badge) atualizado em tempo real mostrando a quantidade de itens no carrinho.
    *   Menu hambúrguer para dispositivos móveis.
*   **Rodapé (Footer)** ([src/components/Footer.tsx](frontend/src/components/Footer.tsx)):
    *   Links institucionais e de categorias.
    *   Formulário de inscrição na newsletter para e-mails de clientes.
*   **Botão de WhatsApp Flutuante** ([src/components/WhatsAppFloat.tsx](frontend/src/components/WhatsAppFloat.tsx)):
    *   Atalho flutuante posicionado no canto inferior direito que redireciona o cliente para atendimento direto via WhatsApp.

---

## 2. Área Pública (E-commerce)

### 2.1 Página Inicial (Home)
*   **Rota**: `/` ([src/routes/index.tsx](frontend/src/routes/index.tsx))
*   **Funcionalidades**:
    *   **Banner Hero**: Apresentação da marca ("Sofisticação em cada detalhe") com chamadas de ação (CTA) para ver a coleção e ler sobre a história da empresa.
    *   **Faixa de Benefícios**: Exibição rápida de vantagens da loja (Prata 925 Certificada, Frete grátis acima de R$ 250, Troca fácil em até 30 dias, Embalagem de presente inclusa).
    *   **Seção de Destaques**: Exibe 4 produtos selecionados do catálogo em destaque através de cards de produto interativos.

### 2.2 Catálogo de Produtos
*   **Rota**: `/produtos` ([src/routes/produtos.tsx](frontend/src/routes/produtos.tsx))
*   **Funcionalidades**:
    *   **Listagem Geral**: Grid responsivo exibindo todos os produtos disponíveis na loja.
    *   **Filtro por Categorias**: Menu lateral que permite filtrar os produtos pelas categorias "Todos", "Prata" (Joias) ou "Cosméticos".
    *   **Filtro por Faixa de Preço**: Controle do tipo *Slider* para definir o preço mínimo e máximo dos itens exibidos (faixa de R$ 0 a R$ 300).
    *   **Ordenação**: Seletor para ordenar produtos por:
        *   Em destaque (ordem padrão).
        *   Menor preço.
        *   Maior preço.
        *   Nome (Ordem alfabética A-Z).
    *   **Cards de Produto** ([src/components/ProductCard.tsx](frontend/src/components/ProductCard.tsx)):
        *   Efeito de *zoom* na imagem ao passar o mouse (*hover*).
        *   Botão rápido "Adicionar" (ou "Adicionar ao carrinho" em mobile) para incluir o produto diretamente na sacola.
        *   Abertura automática do modal de detalhes do produto ao clicar na imagem ou no título.

### 2.3 Detalhes do Produto (Modal)
*   **Componente**: [src/components/ProductDetailDialog.tsx](frontend/src/components/ProductDetailDialog.tsx)
*   **Funcionalidades**:
    *   Exibição detalhada de informações do produto em um modal centralizado (Dialog):
        *   Imagem em alta resolução.
        *   Categoria e nome do produto.
        *   Preço formatado em Reais (BRL).
        *   Descrição textual completa da peça ou cosmético.
        *   Benefícios garantidos (Frete grátis acima de R$ 300, Garantia de 30 dias, Embalagem de presente Angel).
    *   Botão para adicionar o item diretamente à sacola e fechamento automático com notificação visual de sucesso.

### 2.4 Busca de Produtos
*   **Componente**: [src/components/SearchDialog.tsx](frontend/src/components/SearchDialog.tsx)
*   **Funcionalidades**:
    *   Modal de pesquisa acionado a partir do cabeçalho.
    *   **Busca em Tempo Real**: Filtra instantaneamente o nome e a descrição dos produtos conforme o usuário digita.
    *   Exibição de miniaturas de resultados de pesquisa (imagem, nome, categoria e preço).
    *   Redireciona diretamente para a listagem ao clicar no resultado selecionado.

### 2.5 Sobre a Marca
*   **Rota**: `/sobre` ([src/routes/sobre.tsx](frontend/src/routes/sobre.tsx))
*   **Funcionalidades**:
    *   Página institucional com a história por trás da marca Angel (fundada em 2019).
    *   Métricas de sucesso destacadas: Ano de fundação (2019), Clientes atendidos (12k+), Garantia de Prata 925 (100%).

---

## 3. Processo de Compra (Checkout)

### 3.1 Sacola de Compras (Cart Drawer)
*   **Componente**: [src/components/CartDrawer.tsx](frontend/src/components/CartDrawer.tsx)
*   **Funcionalidades**:
    *   Painel lateral deslizante (*Sheet*) que gerencia os itens selecionados.
    *   **Controle de Quantidade**: Botões para incrementar, decrementar ou remover o item da sacola de compras.
    *   **Cálculo de Frete**:
        *   Campo para inserção do CEP do cliente.
        *   Cálculo automático de custos com base na região do CEP inserido (frete grátis se o subtotal for superior a R$ 300).
    *   **E-mail de Contato**: Campo para inserção do e-mail do cliente, obrigatório para prosseguir ao checkout.
    *   **Resumo de Valores**: Exibição detalhada de Subtotal, Frete e Valor Total.
    *   **Validação de Saída**: Bloqueia a continuidade do checkout caso o e-mail ou CEP sejam inválidos ou estejam em branco.

### 3.2 Tela de Checkout
*   **Rota**: `/checkout` ([src/routes/checkout.tsx](frontend/src/routes/checkout.tsx))
*   **Funcionalidades**:
    *   Interface unificada contendo o formulário de entrega e pagamento, além do resumo estático do pedido.
    *   **Formulário de Entrega**: Inputs obrigatórios para Rua, Número, Complemento (opcional), Bairro, Cidade e Estado (UF). O CEP e E-mail são puxados automaticamente do carrinho.
    *   **Métodos de Pagamento (Tabs)**:
        *   **PIX**: Mostra instruções de pagamento e um QR Code fictício dinâmico para simulação.
        *   **Cartão de Crédito**: Formulário completo para dados do cartão (Número do cartão, Nome impresso, Validade e CVV).
        *   **Boleto**: Informa sobre o envio do boleto por e-mail e o prazo de vencimento de 3 dias úteis.
    *   **Resumo de Pedido Lateral**: Lista os produtos contidos na compra com imagens e quantidades, frete calculado e valor final total.
    *   **Finalização**: O clique em "Concluir pedido" valida todos os campos, limpa a sacola do usuário, registra o pedido no banco de dados simulado e redireciona o usuário.

### 3.3 Pedido Concluído (Sucesso)
*   **Rota**: `/pedido-concluido` ([src/routes/pedido-concluido.tsx](frontend/src/routes/pedido-concluido.tsx))
*   **Funcionalidades**:
    *   Agradecimento formal de compra e número de identificação único do pedido gerado (ex: `ANG-20260713-1492`).
    *   **Rastreador de Status do Pedido**: Fluxo visual com etapas indicadoras do status atual:
        *   Pagamento aprovado.
        *   Separando (Status ativo padrão após a compra).
        *   Enviado.
        *   Entregue.
    *   Botão de retorno rápido para continuar comprando no catálogo.

---

## 4. Área Administrativa (Painel de Controle)

A área administrativa é protegida por um validador de autenticação global e possui navegação exclusiva.

### 4.1 Login Administrativo
*   **Rota**: `/admin/login` ([src/routes/admin.login.tsx](frontend/src/routes/admin.login.tsx))
*   **Funcionalidades**:
    *   Tela de autenticação dedicada para a equipe gestora.
    *   Campos para E-mail e Senha (possui as credenciais da conta de demonstração visíveis para facilitação de testes).
    *   Validação local e redirecionamento seguro para o painel principal `/admin` após login.

### 4.2 Guarda de Rotas e Barra Lateral (Sidebar)
*   **Layout Admin**: [src/routes/admin.tsx](frontend/src/routes/admin.tsx)
*   **Barra Lateral**: [src/components/AdminSidebar.tsx](frontend/src/components/AdminSidebar.tsx)
*   **Funcionalidades**:
    *   Proteção automática: Se um usuário não autenticado tenta acessar qualquer sub-rota de `/admin/*`, ele é redirecionado instantaneamente para `/admin/login`.
    *   Barra lateral de navegação com links rápidos para as três seções do painel: **Dashboard**, **Pedidos** e **Produtos**.
    *   Botão "Sair" para revogar o token de autenticação e deslogar do sistema.

### 4.3 Dashboard Principal
*   **Rota**: `/admin` (mapeada para `/admin/` em [src/routes/admin.index.tsx](frontend/src/routes/admin.index.tsx))
*   **Funcionalidades**:
    *   **Cards de KPI (Indicadores)**: Indicadores estatísticos sobre a operação:
        *   **Total de Vendas**: Contagem acumulativa de pedidos criados.
        *   **Receita do Mês**: Somatório financeiro das vendas geradas no mês corrente.
        *   **Pedidos Pendentes**: Contagem de pedidos com status pendente de processamento.
        *   **Produtos**: Quantidade total de produtos ativos no catálogo.
    *   **Gráfico de Volume de Vendas**: Gráfico de barras interativo construído com a biblioteca `recharts`, exibindo as vendas simuladas nos últimos 7 dias.

### 4.4 Gerenciamento de Pedidos (Admin Orders)
*   **Rota**: `/admin/pedidos` ([src/routes/admin.pedidos.tsx](frontend/src/routes/admin.pedidos.tsx))
*   **Funcionalidades**:
    *   **Tabela de Pedidos**: Listagem de todas as ordens de compra efetuadas no e-commerce contendo número do pedido, e-mail do cliente, data de criação, total pago e status atual.
    *   **Visualização de Detalhes**: Ao clicar em uma linha da tabela, abre-se um modal detalhado contendo:
        *   Nome/E-mail do cliente e forma de pagamento escolhida.
        *   Endereço completo de entrega.
        *   Listagem de itens do pedido com foto, quantidade e preço individual.
        *   Subtotal, frete cobrado e total geral da compra.
    *   **Alteração de Status**: Seletor de opções para atualizar o estado do pedido entre: `Pendente`, `Pago`, `Enviado` ou `Concluído`. A alteração persiste no banco de dados local imediatamente.

### 4.5 Gerenciamento do Catálogo de Produtos (Admin Products)
*   **Rota**: `/admin/produtos` ([src/routes/admin.produtos.tsx](frontend/src/routes/admin.produtos.tsx))
*   **Funcionalidades**:
    *   **Tabela de Catálogo**: Listagem de todos os produtos com miniatura da imagem, nome, categoria correspondente, preço e botões de ação.
    *   **Criação de Produto (Create)**: Botão "+ Novo produto" abre formulário modal para cadastrar Nome, Preço (R$), Categoria (Prata ou Cosméticos), URL da imagem e Descrição.
    *   **Edição de Produto (Update)**: Ação de editar preenche o modal com os dados atuais do produto para atualização.
    *   **Remoção de Produto (Delete)**: Ação de excluir deleta o item do catálogo após confirmação do administrador.

---

## 5. Gerenciamento de Dados, Estado e Persistência

O projeto funciona inteiramente no lado do cliente (Client-Side), simulando operações de backend por meio de persistência local.

*   **Mock de Produtos Originais** ([src/lib/products.ts](frontend/src/lib/products.ts)):
    *   Semente inicial com 8 produtos padrão configurados (5 joias de prata e 3 produtos de cosméticos) com preços, descrições e imagens reais importadas.
*   **Banco de Dados Local (Store)** ([src/lib/store.ts](frontend/src/lib/store.ts)):
    *   Usa `localStorage` para ler e salvar modificações feitas nos produtos e pedidos de forma que os dados adicionados, editados ou alterados no painel admin não sejam perdidos ao atualizar a página.
    *   Utiliza a API do React `useSyncExternalStore` para fornecer uma reatividade segura a múltiplos componentes sobre as alterações de produtos e pedidos.
    *   Contém a lógica de geração de códigos de pedidos exclusivos (ex: `ANG-ANO_MES_DIA-RANDOM`).
*   **Carrinho (Context & Provider)** ([src/lib/cart.tsx](frontend/src/lib/cart.tsx)):
    *   Contexto React global que armazena os itens adicionados ao carrinho, a quantidade de cada um, o CEP informado e o e-mail de contato do cliente.
    *   Persiste de forma reativa os dados no localStorage sob a chave `angel:cart`.
    *   Calcula o frete com base em regras: frete grátis para compras acima de R$ 300; caso contrário, é cobrada uma taxa variável baseada no primeiro caractere do CEP (região).
    *   Fornece funções utilitárias de manipulação (`add`, `remove`, `updateQty`, `clear`).
*   **Autenticação do Admin** ([src/lib/admin-auth.ts](frontend/src/lib/admin-auth.ts)):
    *   Gerencia o estado de login do usuário administrador no navegador por meio de chaves de autenticação salvas no `sessionStorage`.
    *   Fornece credenciais padrão estáticas de demonstração (`admin@example.invalid` / `admin123`).
