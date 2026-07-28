import { expect, test, type Page } from "@playwright/test";

const product = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Produto E2E",
  price: 120,
  discountPrice: 120,
  category: "prata",
  image: "/assets/p1-B337s01b.jpg",
  description: "Produto usado no teste do checkout",
  stockQuantity: 5,
  reservedQuantity: 0,
  inStock: true,
};

async function prepareCheckout(page: Page) {
  await page.addInitScript((item) => {
    localStorage.setItem("angel:cart", JSON.stringify({
      items: [{ product: item, quantity: 1 }],
      cep: "",
      phone: "",
      shippingOption: "entrega",
    }));
  }, product);
  await page.route("**/api/pagamentos/infinitepay/status", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"enabled":false}' }));
  await page.route("**/api/produtos", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([product]) }));
  await page.goto("/checkout");
}

async function fillPickupCheckout(page: Page) {
  await page.getByRole("tab", { name: /Retirar na Loja/i }).click();
  await page.getByLabel("Seu Nome").fill("Maria da Silva");
  await page.getByLabel("Seu E-mail").fill("maria@example.com");
  await page.getByLabel("Telefone / WhatsApp").fill("65999998888");
}

test("mostra todos os erros e foca o primeiro campo inválido", async ({ page }) => {
  await prepareCheckout(page);
  await page.getByRole("button", { name: "Revisar pedido" }).click();

  await expect(page.getByText("Informe seu nome e sobrenome.")).toBeVisible();
  await expect(page.getByText("Informe um e-mail válido, como nome@exemplo.com.")).toBeVisible();
  await expect(page.getByText("Informe telefone e DDD.")).toBeVisible();
  await expect(page.locator("#checkout-customerName")).toBeFocused();
  await expect(page.locator("#checkout-customerName")).toHaveAttribute("aria-invalid", "true");
});

test("preserva a sacola após falha e permite repetir até concluir", async ({ page }) => {
  await prepareCheckout(page);
  let attempts = 0;
  await page.route("**/api/pedidos", async (route) => {
    if (route.request().method() !== "POST") return route.fulfill({ status: 200, body: "[]" });
    attempts += 1;
    if (attempts === 1) {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"message":"Serviço temporariamente indisponível."}',
      });
    }
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "10000000-0000-0000-0000-000000000001",
        number: "ANG-E2E-1",
        publicTrackingToken: "token-publico-e2e",
        customerName: "Maria da Silva",
        email: "maria@example.com",
        phone: "65999998888",
        items: [{ productId: product.id, name: product.name, price: 120, quantity: 1 }],
        subtotal: 120,
        shipping: 0,
        total: 120,
        status: "PENDENTE",
        shippingOption: "retirada",
        payment: "PIX",
      }),
    });
  });

  await fillPickupCheckout(page);
  await page.getByRole("button", { name: "Revisar pedido" }).click();
  await page.locator("#checkout-terms").check();
  await page.getByRole("button", { name: "Confirmar e Pagar" }).click();
  await expect(page.getByRole("alert")).toContainText("Seus produtos continuam na sacola");

  const cartAfterFailure = await page.evaluate(() => JSON.parse(localStorage.getItem("angel:cart") || "{}"));
  expect(cartAfterFailure.items).toHaveLength(1);

  await page.getByRole("button", { name: "Confirmar e Pagar" }).click();
  await expect(page).toHaveURL(/pedido-concluido/);
  await expect(page.getByText("ANG-E2E-1")).toBeVisible();
});
