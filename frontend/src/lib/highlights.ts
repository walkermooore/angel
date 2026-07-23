import { type Product } from "./products";
import { useProducts } from "./store";
import { useHomeSettings, homeApi } from "./homeStore";

export function useHighlights(): Product[] {
  const settings = useHomeSettings();
  const allProducts = useProducts();

  const ids = settings.highlightIds || ["1", "2", "3", "4"];
  const result: Product[] = [];

  ids.forEach((id) => {
    const found = allProducts.find((p) => p.id === id);
    if (found) result.push(found);
  });

  return result;
}

export function useHighlightIds(): string[] {
  const settings = useHomeSettings();
  return settings.highlightIds || ["1", "2", "3", "4"];
}

export const highlightsApi = {
  setHighlights: (ids: string[]) => {
    if (ids.length >= 1 && ids.length <= 5) {
      homeApi.update({ highlightIds: ids });
    }
  },
};
