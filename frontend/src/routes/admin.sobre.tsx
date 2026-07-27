import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAboutSettings, aboutApi, type AboutSettings } from "@/lib/aboutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Upload, Info, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/sobre")({
  head: () => ({ meta: [{ title: "Editar Sobre Nós — Admin" }] }),
  component: AdminAboutPage,
});

function AdminAboutPage() {
  const live = useAboutSettings();
  const [form, setForm] = useState<AboutSettings>(live);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(live);
  }, [live]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Use uma imagem JPEG, PNG ou WebP.");
        e.target.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2 MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
        toast.success("Imagem selecionada do computador com sucesso!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await aboutApi.save(form);
      toast.success("Página 'Sobre Nós' atualizada com sucesso no banco!");
    } catch {
      toast.error("Erro ao salvar alterações no banco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Editar "Sobre Nós"</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Altere os textos, imagem principal e métricas exibidas na página pública Sobre Nós.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="rounded-full h-11 px-6 uppercase tracking-widest text-xs gap-2">
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cabeçalho */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Info className="h-5 w-5" /> Título e Subtítulo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Subtítulo Superior</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Ex: Nossa história"
                className="h-11 mt-1.5"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Título Principal (Frase de Destaque)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Beleza é fazer do essencial algo memorável."
                className="h-11 mt-1.5"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Imagem Principal do Computador */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Imagem Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.imageUrl && (
              <div className="relative aspect-[16/9] max-w-md rounded-xl overflow-hidden border border-border bg-secondary/30 shadow-sm">
                <img src={form.imageUrl} alt="Preview da foto do Sobre Nós" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 px-6 gap-2 rounded-xl border-foreground/30 hover:bg-secondary font-medium"
              >
                <Upload className="h-4 w-4 text-primary" /> Selecionar foto do computador
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parágrafos da História */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xl font-display">Texto da História</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Parágrafo 1</Label>
              <Textarea
                rows={3}
                value={form.paragraph1}
                onChange={(e) => setForm({ ...form, paragraph1: e.target.value })}
                className="mt-1.5 leading-relaxed"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Parágrafo 2</Label>
              <Textarea
                rows={3}
                value={form.paragraph2}
                onChange={(e) => setForm({ ...form, paragraph2: e.target.value })}
                className="mt-1.5 leading-relaxed"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Parágrafo 3</Label>
              <Textarea
                rows={3}
                value={form.paragraph3}
                onChange={(e) => setForm({ ...form, paragraph3: e.target.value })}
                className="mt-1.5 leading-relaxed"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Métricas / Estatísticas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xl font-display">Métricas / Estatísticas em Destaque</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Métrica 1</p>
              <div>
                <Label className="text-[10px] uppercase">Número / Valor</Label>
                <Input
                  value={form.stat1Number}
                  onChange={(e) => setForm({ ...form, stat1Number: e.target.value })}
                  placeholder="2019"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase">Legenda</Label>
                <Input
                  value={form.stat1Label}
                  onChange={(e) => setForm({ ...form, stat1Label: e.target.value })}
                  placeholder="Fundação"
                  className="h-10 mt-1"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Métrica 2</p>
              <div>
                <Label className="text-[10px] uppercase">Número / Valor</Label>
                <Input
                  value={form.stat2Number}
                  onChange={(e) => setForm({ ...form, stat2Number: e.target.value })}
                  placeholder="12k+"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase">Legenda</Label>
                <Input
                  value={form.stat2Label}
                  onChange={(e) => setForm({ ...form, stat2Label: e.target.value })}
                  placeholder="Clientes"
                  className="h-10 mt-1"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Métrica 3</p>
              <div>
                <Label className="text-[10px] uppercase">Número / Valor</Label>
                <Input
                  value={form.stat3Number}
                  onChange={(e) => setForm({ ...form, stat3Number: e.target.value })}
                  placeholder="100%"
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase">Legenda</Label>
                <Input
                  value={form.stat3Label}
                  onChange={(e) => setForm({ ...form, stat3Label: e.target.value })}
                  placeholder="Prata 925"
                  className="h-10 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="rounded-full h-12 px-8 uppercase tracking-widest text-xs font-bold gap-2">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
