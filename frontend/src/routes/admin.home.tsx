import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useHomeSettings, homeApi, type ValueItem } from "@/lib/homeStore";
import { useProducts } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Save, Upload, Star, Layout, Sparkles, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/home")({
  component: AdminHomePage,
});

export function AdminHomePage() {
  const settings = useHomeSettings();
  const products = useProducts();

  const [heroTitle, setHeroTitle] = useState(settings.heroTitle);
  const [heroDescription, setHeroDescription] = useState(settings.heroDescription);
  const [heroImage, setHeroImage] = useState(settings.heroImage);
  const [values, setValues] = useState<ValueItem[]>(settings.values);
  const [highlights, setHighlights] = useState<string[]>(settings.highlightIds);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setHeroImage(reader.result as string);
        toast.success("Imagem do Hero atualizada!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Differentials Management (Add / Remove / Edit)
  const handleAddValue = () => {
    setValues([...values, { id: crypto.randomUUID(), title: "", subtitle: "" }]);
  };

  const handleRemoveValue = (index: number) => {
    if (values.length <= 1) {
      toast.error("Mantenha ao menos 1 diferencial.");
      return;
    }
    setValues(values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, field: "title" | "subtitle", val: string) => {
    const next = [...values];
    next[index] = { ...next[index], [field]: val };
    setValues(next);
  };

  // Highlights Management (Exclusive selection, fixed at 4 slots — no add/remove)
  const HIGHLIGHTS_COUNT = 4;

  // Ensure we always have exactly 4 slots on mount
  useEffect(() => {
    if (highlights.length < HIGHLIGHTS_COUNT) {
      const unused = products.filter((p) => !highlights.includes(p.id));
      const extra = unused.slice(0, HIGHLIGHTS_COUNT - highlights.length).map((p) => p.id);
      if (extra.length > 0) setHighlights((prev) => [...prev, ...extra]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleHighlightChange = (index: number, newId: string) => {
    const isDuplicate = highlights.some((id, i) => i !== index && id === newId);
    if (isDuplicate) {
      toast.error("Este produto já foi selecionado em outra posição. Selecione um produto exclusivo.");
      return;
    }
    const next = [...highlights];
    next[index] = newId;
    setHighlights(next);
  };

  const handleSaveAll = () => {
    if (!heroTitle.trim()) {
      toast.error("Informe o título principal da Home.");
      return;
    }

    // Verify uniqueness of highlights
    const savedHighlights = highlights.slice(0, HIGHLIGHTS_COUNT);
    const uniqueHighlights = new Set(savedHighlights);
    if (uniqueHighlights.size < savedHighlights.length) {
      toast.error("Existem produtos duplicados em destaque. Escolha apenas produtos exclusivos.");
      return;
    }

    homeApi.update({
      heroTitle: heroTitle.trim(),
      heroDescription: heroDescription.trim(),
      heroImage,
      values,
      highlightIds: savedHighlights,
    });
    toast.success("Configurações da Página Home salvas com sucesso!");
  };

  return (
    <div className="p-6 sm:p-10 w-full space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" /> Configurações da Página Home
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize o banner Hero, faixas de diferencial e gerencie de 1 até no máximo 5 produtos em destaque.
          </p>
        </div>

        <Button onClick={handleSaveAll} className="rounded-full h-11 px-8 uppercase tracking-widest text-xs gap-2 shrink-0">
          <Save className="h-4 w-4" /> Salvar Tudo
        </Button>
      </div>

      {/* 1. Hero Banner */}
      <div className="border border-border rounded-xl p-6 bg-background space-y-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Banner Hero Principal
        </h2>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Título Principal</Label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Ex: Sofisticação em cada detalhe."
                className="h-11 text-sm font-medium"
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest mb-1.5 block">Descrição Principal</Label>
              <Textarea
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Escreva a apresentação da marca que aparecerá na Home..."
                className="min-h-[100px] text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Upload & Preview Imagem Hero */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest block">Imagem do Banner Hero</Label>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-secondary/30 flex items-center justify-center">
              {heroImage ? (
                <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">Nenhuma imagem selecionada</p>
                </div>
              )}
            </div>

            <label className="inline-flex items-center justify-center w-full h-11 px-4 rounded-full border border-border bg-background hover:bg-secondary cursor-pointer transition-colors text-xs font-semibold uppercase tracking-widest gap-2">
              <Upload className="h-4 w-4" /> Alterar Imagem do Hero
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Value Strips (Faixa de Diferenciais Dinâmica) */}
      <div className="border border-border rounded-xl p-6 bg-background space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" /> Faixa de Diferenciais da Marca
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione ou remova cartões de diferencial. O layout na Home se ajusta automaticamente.
            </p>
          </div>
          <Button onClick={handleAddValue} variant="outline" className="rounded-full text-xs uppercase tracking-widest gap-1.5 h-9 px-4">
            <Plus className="h-3.5 w-3.5" /> Adicionar Diferencial
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <div key={v.id || i} className="p-4 rounded-xl border bg-secondary/10 space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Diferencial #{i + 1}
                </span>
                {values.length > 1 && (
                  <button
                    onClick={() => handleRemoveValue(i)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Remover este diferencial"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest mb-1 block">Título</Label>
                <Input
                  value={v.title}
                  onChange={(e) => handleValueChange(i, "title", e.target.value)}
                  placeholder="Ex: Prata 925"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest mb-1 block">Subtítulo</Label>
                <Input
                  value={v.subtitle}
                  onChange={(e) => handleValueChange(i, "subtitle", e.target.value)}
                  placeholder="Ex: Certificada"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Selecionados para Você (Produtos Exclusivos - Fixo em 4) */}
      <div className="border border-border rounded-xl p-6 bg-background space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Selecionados para Você (4 produtos fixos)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha os 4 produtos exclusivos que aparecem na seção "Selecionados para Você" da Home.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.slice(0, 4).map((selectedId, idx) => {
            const selectedProduct = products.find((p) => p.id === selectedId);
            return (
              <div key={idx} className="p-4 rounded-xl border border-border bg-secondary/10 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                      Posição #{idx + 1}
                    </span>
                  </div>

                  <Select value={selectedId} onValueChange={(v) => handleHighlightChange(idx, v)}>
                    <SelectTrigger className="h-10 bg-background text-xs">
                      <SelectValue placeholder="Selecione um produto exclusivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => {
                        const isChosenElsewhere = highlights.some((id, i) => i !== idx && id === p.id);
                        return (
                          <SelectItem key={p.id} value={p.id} disabled={isChosenElsewhere} className="text-xs">
                            {p.name} {isChosenElsewhere ? "(Já selecionado)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="p-2.5 rounded-lg border bg-background flex items-center gap-2.5 mt-2">
                    <img src={selectedProduct.image} alt="" className="h-10 w-10 rounded object-cover bg-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground">{selectedProduct.name}</p>
                      <p className="text-[10px] text-muted-foreground">R$ {selectedProduct.price.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveAll} className="rounded-full h-12 px-10 uppercase tracking-widest text-xs gap-2">
          <Save className="h-4 w-4" /> Salvar Configurações da Home
        </Button>
      </div>
    </div>
  );
}
