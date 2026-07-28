import { useSyncExternalStore } from "react";
import { getFaqsFromBackend, createFaqInBackend, updateFaqInBackend, deleteFaqFromBackend } from "./api";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_KEY = "angel:faqs";

function loadFaqs(): FaqItem[] {
  return [];
}

type Listener = () => void;
let state: FaqItem[] = loadFaqs();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  getFaqsFromBackend().then((remoteFaqs) => {
    if (Array.isArray(remoteFaqs)) hydrateFaqs(remoteFaqs);
  });
}

export function normalizeFaqs(remoteFaqs: any[]): FaqItem[] {
  return remoteFaqs.map((faq: any) => ({
    id: String(faq.id),
    question: faq.question || "",
    answer: faq.answer || "",
  }));
}

export function hydrateFaqs(remoteFaqs: any[]) {
  state = normalizeFaqs(remoteFaqs);
  emit();
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
