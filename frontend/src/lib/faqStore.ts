import { useSyncExternalStore } from "react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_KEY = "angel:faqs";

const seedFaqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "As joias são realmente em Prata 925?",
    answer: "Sim, 100% legítimas! Todas as nossas peças são fabricadas em Prata 925 autêntica com garantia vitalícia quanto ao teor do metal.",
  },
  {
    id: "faq-2",
    question: "Como funciona o envio e a opção de retirar na loja?",
    answer: "Oferecemos frete grátis para compras acima de R$ 250,00 e também a opção de Retirada Grátis em nossa loja física em Cuiabá/MT ([endereço de retirada removido]).",
  },
  {
    id: "faq-3",
    question: "Como enviar meu pedido via WhatsApp?",
    answer: "Após finalizar a compra no checkout, um código único do pedido é gerado e você pode enviá-lo diretamente para nosso atendimento no WhatsApp ([contato removido]).",
  },
  {
    id: "faq-4",
    question: "Qual o prazo de troca?",
    answer: "Você tem até 30 dias após o recebimento para solicitar a troca por outro produto ou tamanho.",
  },
];

function loadFaqs(): FaqItem[] {
  if (typeof window === "undefined") return seedFaqs;
  try {
    const raw = localStorage.getItem(FAQ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(FAQ_KEY, JSON.stringify(seedFaqs));
  return seedFaqs;
}

type Listener = () => void;
let state: FaqItem[] = loadFaqs();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const faqStore = {
  get: () => state,
  set: (next: FaqItem[]) => {
    state = next;
    try {
      localStorage.setItem(FAQ_KEY, JSON.stringify(next));
    } catch {}
    emit();
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useFaqs(): FaqItem[] {
  return useSyncExternalStore(faqStore.subscribe, faqStore.get, () => state);
}

export const faqApi = {
  add: (question: string, answer: string) => {
    const newFaq: FaqItem = {
      id: crypto.randomUUID(),
      question,
      answer,
    };
    faqStore.set([...faqStore.get(), newFaq]);
  },
  update: (id: string, question: string, answer: string) => {
    faqStore.set(
      faqStore.get().map((f) => (f.id === id ? { ...f, question, answer } : f))
    );
  },
  remove: (id: string) => {
    faqStore.set(faqStore.get().filter((f) => f.id !== id));
  },
};
