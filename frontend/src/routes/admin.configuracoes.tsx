import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  component: AdminConfiguracoes,
});

const SETTINGS_KEY = "angel:admin:settings";

type Settings = {
  storeName: string;
  supportEmail: string;
  supportWhatsapp: string;
};

const defaults: Settings = {
  storeName: "Angel",
  supportEmail: "contato@example.invalid",
  supportWhatsapp: "(00) 00000-0000",
};

function AdminConfiguracoes() {
  const [settings, setSettings] = useState<Settings>(defaults);

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

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast.success("Configurações salvas");
  };

  return (
    <div className="w-full p-6 sm:p-10">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Configurações</h1>

      <form onSubmit={save} className="max-w-2xl space-y-5">
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
        <Button type="submit" className="h-11 rounded-full uppercase tracking-widest text-xs px-8">
          Salvar configurações
        </Button>
      </form>
    </div>
  );
}
