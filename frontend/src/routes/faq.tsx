import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useFaqs } from "@/lib/faqStore";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "Perguntas Frequentes (FAQ) — Angel" }] }),
  component: FaqPage,
});

function FaqPage() {
  const faqs = useFaqs();

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 sm:py-20 space-y-8">
      <div className="border-b border-border pb-6 text-center sm:text-left">
        <p className="uppercase tracking-[0.3em] text-xs text-muted-foreground mb-3 flex items-center justify-center sm:justify-start gap-1.5">
          <HelpCircle className="h-4 w-4" /> Suporte & Dúvidas
        </p>
        <h1 className="font-display text-4xl sm:text-5xl">Perguntas Frequentes</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
          Respostas para as dúvidas mais comuns sobre a Angel
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
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
      </Accordion>
    </div>
  );
}
