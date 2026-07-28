import { expect, test } from "@playwright/test";

test("não renderiza o texto antigo da Home durante o carregamento inicial", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Sofisticação em cada detalhe.")).toHaveCount(0);
  await expect(page.getByText("Peças em prata 925 e cosméticos selecionados.")).toHaveCount(0);

  const currentHeading = page.locator("main h1");
  const neutralLoading = page.getByRole("status", { name: "Carregando conteúdo" });
  await expect(currentHeading.or(neutralLoading)).toBeVisible();
});

test("catálogo nunca restaura os produtos fixos do frontend", async ({ page }) => {
  await page.goto("/produtos");

  await expect(page.getByText("Argolas Lumière")).toHaveCount(0);
  await expect(page.getByText("Anel Solitaire Cristal")).toHaveCount(0);

  await expect(page.getByText(/\d+ produtos?/)).toBeVisible();
});
