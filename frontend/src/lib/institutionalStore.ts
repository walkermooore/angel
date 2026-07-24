import { useSyncExternalStore } from "react";
import {
  getInstitutionalSettingsFromBackend,
  saveInstitutionalSettingsToBackend,
} from "./api";

export type InstitutionalSettings = {
  termsContent: string;
  exchangesContent: string;
  privacyContent: string;
};

export const institutionalDefaults: InstitutionalSettings = {
  termsContent: `Bem-vinda à loja online da Angel. Ao acessar e utilizar este site, você concorda com os seguintes termos e condições:

1. Propriedade Intelectual
Todo o conteúdo visual, fotografias, marcas, nomes comerciais e design do site são de propriedade exclusiva da marca Angel. É proibida a reprodução sem autorização prévia por escrito.

2. Informações dos Produtos e Preços
Trabalhamos para garantir que todas as descrições, preços e disponibilidades dos produtos estejam corretos. Reservamo-nos o direito de corrigir eventuais erros tipográficos de preço sem aviso prévio.

3. Garantia das Joias em Prata 925
Garantimos a autenticidade do teor da Prata 925 de nossas peças. A garantia não cobre mau uso, quedas, arranhões ou exposição a reagentes químicos agressivos.`,
  exchangesContent: `Queremos que você fique 100% satisfeita com sua compra na Angel. Caso precise trocar ou devolver um produto, siga as orientações abaixo:

1. Prazo para Devolução por Arrependimento
Você tem até 7 (sete) dias corridos após o recebimento do pedido para solicitar a devolução total ou parcial dos produtos por arrependimento, conforme previsto no Código de Defesa do Consumidor.

2. Prazo para Trocas
As solicitações de troca por outro modelo ou tamanho podem ser feitas em até 30 (trinta) dias corridos a contar do recebimento da encomenda.

3. Condições dos Produtos
O produto deve ser devolvido em sua embalagem original, acompanhado da nota fiscal/certificado de garantia da prata 925, sem indícios de uso ou avaria.

4. Como Solicitar
Envie uma mensagem via WhatsApp para nosso atendimento pelo número [contato removido] informando o número do seu pedido e o motivo da troca.`,
  privacyContent: `A Angel compromete-se com a segurança e a privacidade dos dados de nossos clientes durante todo o processo de navegação e compra pelo site.

1. Coleta de Informações
Coletamos dados estritamente necessários para o processamento de compras, entrega de pedidos e comunicação referente aos seus pedidos (como nome, endereço, telefone de contato e endereço de e-mail).

2. Uso e Proteção dos Dados
Seus dados pessoais não serão vendidos, trocados ou divulgados para terceiros, exceto quando essas informações são necessárias para o processo de entrega ou cobrança.

3. Segurança
Adotamos medidas técnicas e administrativas para proteger as informações contra acessos não autorizados, perda, alteração ou divulgação indevida.`,
};

let state = institutionalDefaults;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export async function refreshInstitutionalSettings() {
  const remote = await getInstitutionalSettingsFromBackend();
  if (remote) {
    state = {
      termsContent: remote.termsContent || institutionalDefaults.termsContent,
      exchangesContent: remote.exchangesContent || institutionalDefaults.exchangesContent,
      privacyContent: remote.privacyContent || institutionalDefaults.privacyContent,
    };
    emit();
  }
  loaded = true;
  return state;
}

export function useInstitutionalSettings() {
  const settings = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => institutionalDefaults
  );

  if (typeof window !== "undefined" && !loaded) {
    void refreshInstitutionalSettings();
  }

  return settings;
}

export async function saveInstitutionalSettings(settings: InstitutionalSettings) {
  const saved = await saveInstitutionalSettingsToBackend(settings);
  state = {
    termsContent: saved.termsContent,
    exchangesContent: saved.exchangesContent,
    privacyContent: saved.privacyContent,
  };
  loaded = true;
  emit();
  return state;
}
