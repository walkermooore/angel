import { API_BASE } from "./api";

export interface ShippingQuote {
  id: string;
  name: string;
  price: number;
  deliveryTime: number;
  company: string;
  companyLogo?: string;
}

export interface FreightParams {
  toCep: string;
  items: Array<{ productId: string; quantity: number }>;
}

export async function calculateMelhorEnvioFreight({ toCep, items }: FreightParams): Promise<ShippingQuote[]> {
  const response = await fetch(`${API_BASE}/frete/cotacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cep: toCep, items }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível consultar o Melhor Envio.");
  }

  return response.json() as Promise<ShippingQuote[]>;
}
