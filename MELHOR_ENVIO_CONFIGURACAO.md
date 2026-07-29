# Configuração do Melhor Envio

## 1. Preparar os produtos

No painel administrativo, acesse **Produtos** e preencha em cada item:

- peso do produto embalado, em quilogramas;
- altura, largura e comprimento da embalagem, em centímetros.

O painel **Avisos** lista os produtos incompletos. A cotação é bloqueada enquanto algum item da sacola não tiver dados físicos válidos.

## 2. Configurar e autorizar no Sandbox

1. Crie uma conta em <https://sandbox.melhorenvio.com.br/>.
2. Cadastre um aplicativo no Sandbox.
3. Cadastre exatamente a URL de callback usada pelo backend. No desenvolvimento:

   `http://localhost:8081/api/frete/oauth/callback`

4. Copie `backend/.env.example` para o arquivo de ambiente usado pelo backend e configure:

   ```env
   MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br
   MELHOR_ENVIO_CLIENT_ID=ID_DO_APLICATIVO_SANDBOX
   MELHOR_ENVIO_CLIENT_SECRET=SEGREDO_DO_APLICATIVO_SANDBOX
   MELHOR_ENVIO_REDIRECT_URI=http://localhost:8081/api/frete/oauth/callback
   MELHOR_ENVIO_USER_AGENT=Portfolio Ecommerce (configure-um-contato)
   MELHOR_ENVIO_ORIGIN_CEP=CEP_REAL_DE_POSTAGEM
   JWT_SECRET=SEGREDO_FIXO_COM_PELO_MENOS_32_CARACTERES
   ```

5. Reinicie o backend.
6. Entre em **Administração → Configurações** e clique em **Autorizar Melhor Envio**.
7. Autorize usando a conta criada no Sandbox.

O `JWT_SECRET` protege os tokens salvos no banco. Não o altere depois da autorização; se ele mudar, será necessário apagar a credencial armazenada e autorizar novamente.

## 3. Roteiro de homologação no Sandbox

- calcular frete para diferentes CEPs e quantidades;
- confirmar que produtos sem medidas são recusados;
- selecionar uma cotação e finalizar o pedido;
- modificar preço ou identificador no navegador e confirmar a recusa;
- testar retirada na loja sem chamada ao Melhor Envio;
- renovar o token e repetir uma cotação;
- testar token expirado ou revogado e a reautorização;
- comparar preço e prazo retornados com o painel do Melhor Envio.

## 4. Passar para produção

Sandbox e produção são ambientes independentes. Para produção:

1. Crie ou regularize a conta real da loja no Melhor Envio.
2. Cadastre um novo aplicativo no ambiente de produção.
3. Use a URL HTTPS pública e exata do callback, por exemplo:

   `https://api.seudominio.com/api/frete/oauth/callback`

4. Envie o aplicativo para homologação com o material solicitado pelo Melhor Envio, como instruções de ativação, logotipo e capturas de tela.
5. No ambiente de produção, configure:

   ```env
   MELHOR_ENVIO_BASE_URL=https://melhorenvio.com.br
   MELHOR_ENVIO_CLIENT_ID=ID_DO_APLICATIVO_DE_PRODUCAO
   MELHOR_ENVIO_CLIENT_SECRET=SEGREDO_DO_APLICATIVO_DE_PRODUCAO
   MELHOR_ENVIO_REDIRECT_URI=https://api.seudominio.com/api/frete/oauth/callback
   MELHOR_ENVIO_USER_AGENT=Portfolio Ecommerce (configure-um-contato)
   MELHOR_ENVIO_ORIGIN_CEP=CEP_REAL_DE_POSTAGEM
   ```

6. Faça uma nova autorização no painel administrativo. Tokens do Sandbox não funcionam em produção.
7. Execute uma compra controlada antes de liberar o frete aos clientes.

Nunca salve `client_secret`, tokens ou `JWT_SECRET` no Git.
