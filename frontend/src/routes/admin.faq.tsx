import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFaqs, faqApi, type FaqItem } from "@/lib/faqStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HelpCircle, Plus, Edit, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/faq")({
  component: AdminFaqPage,
});

export function AdminFaqPage() {
  const faqs = useFaqs();

  const [openModal, setOpenModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setOpenModal(true);
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOpenModal(true);
  };

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Preencha a pergunta e a resposta.");
      return;
    }

    if (editingFaq) {
      faqApi.update(editingFaq.id, question.trim(), answer.trim());
      toast.success("Pergunta atualizada com sucesso!");
    } else {
      faqApi.add(question.trim(), answer.trim());
      toast.success("Nova pergunta adicionada ao FAQ!");
    }

    setOpenModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta pergunta?")) {
      faqApi.remove(id);
      toast.success("Pergunta excluída com sucesso!");
    }
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" /> Gerenciar FAQ (Perguntas Frequentes)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, edite e organize as perguntas e respostas que aparecem para os clientes.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="rounded-full h-11 px-6 uppercase tracking-widest text-xs gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Nova Pergunta
        </Button>
      </div>

      <div className="grid gap-4">
        {faqs.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl bg-secondary/10 text-muted-foreground">
            Nenhuma pergunta cadastrada no FAQ. Clique em "Nova Pergunta" para adicionar.
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="p-5 border border-border rounded-xl bg-background flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <h3 className="font-semibold text-base text-foreground">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(faq)} title="Editar">
                  <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)} title="Excluir">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar / Editar FAQ */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">
              {editingFaq ? "Editar Pergunta" : "Criar Nova Pergunta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Pergunta</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Qual é o prazo de entrega para meu estado?"
                className="h-11 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Resposta</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escreva a resposta completa que os clientes verão..."
                className="min-h-[120px] text-sm leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-full text-xs uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-full text-xs uppercase tracking-widest gap-2">
              <Save className="h-4 w-4" /> Salvar Pergunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
