# 🔀 Estrutura de Rotas (TanStack Start & Router)

Este diretório contém a definição de todas as rotas e páginas do frontend da aplicação **Angel**. O projeto utiliza o sistema de **Roteamento Baseado em Arquivos** (File-Based Routing) fornecido pelo **TanStack Router**.

> [!IMPORTANT]
> Toda a estrutura de rotas é inferida a partir dos arquivos criados nesta pasta. O arquivo `src/routeTree.gen.ts` é gerado automaticamente pelo compilador do TanStack. Nunca edite esse arquivo manualmente.

---

## 📅 Convenções de Roteamento

A tabela abaixo descreve como os arquivos neste diretório são mapeados para URLs na aplicação:

| Arquivo / Pasta | URL gerada | Descrição / Comportamento |
| :--- | :--- | :--- |
| `__root.tsx` | *N/A* | O shell raiz do app. Define o layout global, importa o CSS principal e contém o `<Outlet />` onde as sub-rotas são renderizadas. |
| `index.tsx` | `/` | A página inicial da vitrine do e-commerce. |
| `sobre.tsx` | `/sobre` | Página institucional com informações sobre a marca. |
| `produtos.tsx` | `/produtos` | Página de listagem com catálogo completo de produtos. |
| `checkout.tsx` | `/checkout` | Página com o formulário de finalização de compras. |
| `pedido-concluido.tsx` | `/pedido-concluido` | Página de confirmação exibida após a conclusão bem-sucedida de um pedido. |
| `admin.tsx` | `/admin` | Rota de layout para o painel administrativo. Renders as sub-rotas como o dashboard ou estoque. |
| `admin.index.tsx` | `/admin/` | Dashboard inicial do painel de administração (após o login). |
| `admin.login.tsx` | `/admin/login` | Tela de autenticação para acesso ao painel de administração. |
| `admin.produtos.tsx` | `/admin/produtos` | Tela administrativa para cadastro e listagem de produtos do estoque. |
| `admin.pedidos.tsx` | `/admin/pedidos` | Tela administrativa para gerenciamento e atualização dos status de compras. |

---

## 🛠️ Regras Importantes

1.  **Layouts Globais (`_layout.tsx`)**: Se precisar criar um layout que encapsule rotas filhas sem alterar o caminho na URL, use o prefixo de underline (ex: `_dashboard.tsx` com sub-páginas dentro de uma pasta `_dashboard/`).
2.  **Parâmetros Dinâmicos**: Para criar parâmetros de URL dinâmicos, use o cifrão (`$`). Por exemplo: `produtos/$id.tsx` mapeia para `/produtos/:id` e o valor do parâmetro pode ser extraído usando o hook `useParams()`.
3.  **Componente `<Outlet />`**: Lembre-se de que qualquer arquivo de layout ou rota pai deve renderizar o componente `<Outlet />` importado do `@tanstack/react-router` para que suas rotas filhas correspondentes sejam renderizadas no local correto.
