import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFaqsFromBackend } from "@/lib/api";
import { hydrateFaqs, normalizeFaqs } from "@/lib/faqStore";
import { HelpCircle } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/faq")({
  loader: async () => {
    const remote = await getFaqsFromBackend();
    return { faqs: Array.isArray(remote) ? normalizeFaqs(remote) : null };
  },
  head: () => ({ meta: [{ title: "Perguntas Frequentes (FAQ) — Angell" }] }),
  component: FaqPage,
});

function FaqPage() {
  const { faqs } = Route.useLoaderData();
  useEffect(() => {
    if (faqs) hydrateFaqs(faqs);
  }, [faqs]);

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6 text-center sm:text-left">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3 flex items-center justify-center sm:justify-start gap-1.5">
          <HelpCircle className="h-4 w-4" /> Suporte & Dúvidas
        </p>
        <h1 className="font-display text-4xl sm:text-5xl">Perguntas Frequentes</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
          Respostas para as dúvidas mais comuns sobre a Angell
        </p>
      </div>

      {faqs === null ? (
        <div className="space-y-4" role="status" aria-label="Carregando perguntas">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />)}
        </div>
      ) : <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq, i) => (
          <AccordionItem key={faq.id} value={`item-${i}`} className="border rounded-xl px-6 bg-secondary/10">
            <AccordionTrigger className="text-base font-medium hover:no-underline py-4 text-foreground text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>}
    </div>
  );
}
