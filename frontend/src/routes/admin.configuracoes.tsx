import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getInfinitePayStatus, getInstitutionalSettingsFromBackend, getMelhorEnvioAuthorizationUrl } from "@/lib/api";
import {
  institutionalDefaults,
  normalizeInstitutionalSettings,
  saveInstitutionalSettings,
  type InstitutionalSettings,
} from "@/lib/institutionalStore";

export const Route = createFileRoute("/admin/configuracoes")({
  loader: async () => {
    const [pages, infinitePay] = await Promise.all([
      getInstitutionalSettingsFromBackend(),
      getInfinitePayStatus(),
    ]);
    return {
      pages: normalizeInstitutionalSettings(pages),
      infinitePayEnabled: infinitePay?.enabled === true,
    };
  },
  component: AdminConfiguracoes,
});

const SETTINGS_KEY = "angel:admin:settings";

type Settings = {
  storeName: string;
  supportEmail: string;
  supportWhatsapp: string;
};

const defaults: Settings = {
  storeName: "Angell",
  supportEmail: "",
  supportWhatsapp: "",
};

function AdminConfiguracoes() {
  const loaded = Route.useLoaderData();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [pages, setPages] = useState<InstitutionalSettings>(loaded.pages);
  const [saving, setSaving] = useState(false);
  const [authorizingShipping, setAuthorizingShipping] = useState(false);
  const [infinitePayEnabled] = useState(loaded.infinitePayEnabled);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      setSettings({
        storeName: parsed.storeName || defaults.storeName,
        supportEmail: parsed.supportEmail || defaults.supportEmail,
        supportWhatsapp: parsed.supportWhatsapp || defaults.supportWhatsapp,
      });
    } catch {
      setSettings(defaults);
    }
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      const savedPages = await saveInstitutionalSettings(pages);
      setPages(savedPages);
      toast.success("Configurações e páginas institucionais salvas");
    } catch {
      toast.error("Não foi possível salvar. Verifique se o backend está em execução.");
    } finally {
      setSaving(false);
    }
  };

  const authorizeMelhorEnvio = async () => {
    setAuthorizingShipping(true);
    try {
      const { url } = await getMelhorEnvioAuthorizationUrl();
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a autorização.");
      setAuthorizingShipping(false);
    }
  };

  return (
    <div className="w-full p-6 sm:p-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Configurações</h1>

      <form onSubmit={save} className="w-full space-y-5">
        <div className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="font-display text-2xl">Melhor Envio</h2>
          <p className="text-sm text-muted-foreground">
            Autorize a loja para calcular fretes. O token será renovado automaticamente.
          </p>
          <Button type="button" variant="outline" disabled={authorizingShipping} onClick={authorizeMelhorEnvio}>
            {authorizingShipping ? "Redirecionando..." : "Autorizar Melhor Envio"}
          </Button>
        </div>
        <div className="rounded-xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">InfinitePay</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              infinitePayEnabled
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}>
              {infinitePayEnabled ? "Pronta para uso" : "Aguardando configuração"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            O checkout permanecerá desativado até a InfiniteTag e as URLs públicas serem configuradas no backend.
          </p>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest">Nome da loja</Label>
          <Input
            value={settings.storeName}
            onChange={(e) => setSettings((prev) => ({ ...prev, storeName: e.target.value }))}
            className="h-11 mt-1.5"
            required
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest">E-mail de suporte</Label>
          <Input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
            className="h-11 mt-1.5"
            required
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest">WhatsApp de suporte</Label>
          <Input
            value={settings.supportWhatsapp}
            onChange={(e) => setSettings((prev) => ({ ...prev, supportWhatsapp: e.target.value }))}
            className="h-11 mt-1.5"
            required
          />
        </div>
        <div className="border-t border-border pt-7 space-y-5">
          <div>
            <h2 className="font-display text-2xl">Páginas institucionais</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Edite os textos exibidos publicamente. As quebras de linha são preservadas.
            </p>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Termos de uso</Label>
            <Textarea
              value={pages.termsContent}
              onChange={(e) => setPages((prev) => ({ ...prev, termsContent: e.target.value }))}
              className="mt-1.5 min-h-64"
              required
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Trocas e devoluções</Label>
            <Textarea
              value={pages.exchangesContent}
              onChange={(e) => setPages((prev) => ({ ...prev, exchangesContent: e.target.value }))}
              className="mt-1.5 min-h-64"
              required
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Política de privacidade</Label>
            <Textarea
              value={pages.privacyContent}
              onChange={(e) => setPages((prev) => ({ ...prev, privacyContent: e.target.value }))}
              className="mt-1.5 min-h-64"
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="h-11 rounded-full uppercase tracking-widest text-xs px-8">
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </div>
  );
}
