import { useSyncExternalStore } from "react";
import { getFaqsFromBackend, createFaqInBackend, updateFaqInBackend, deleteFaqFromBackend } from "./api";

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
  return seedFaqs;
}

type Listener = () => void;
let state: FaqItem[] = loadFaqs();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  getFaqsFromBackend().then((remoteFaqs) => {
    if (remoteFaqs && Array.isArray(remoteFaqs) && remoteFaqs.length > 0) {
      state = remoteFaqs.map((f: any) => ({
        id: String(f.id),
        question: f.question,
        answer: f.answer,
      }));
      emit();
    }
  });
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
    createFaqInBackend({ question, answer });
  },
  update: (id: string, question: string, answer: string) => {
    faqStore.set(
      faqStore.get().map((f) => (f.id === id ? { ...f, question, answer } : f))
    );
    updateFaqInBackend(id, { question, answer });
  },
  remove: (id: string) => {
    faqStore.set(faqStore.get().filter((f) => f.id !== id));
    deleteFaqFromBackend(id);
  },
};
