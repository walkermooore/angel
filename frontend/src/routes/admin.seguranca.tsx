import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Laptop, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAuth } from "@/lib/admin-auth";
import {
  confirmAdminTwoFactor,
  disableAdminTwoFactor,
  getAdminProfile,
  getAdminSessions,
  revokeAdminSession,
  revokeOtherAdminSessions,
  setupAdminTwoFactor,
  type AdminSession,
} from "@/lib/api";

export const Route = createFileRoute("/admin/seguranca")({
  head: () => ({ meta: [{ title: "Segurança — Admin Angell" }] }),
  component: AdminSecurityPage,
});

function AdminSecurityPage() {
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; provisioningUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [profile, activeSessions] = await Promise.all([getAdminProfile(), getAdminSessions()]);
    setTwoFactorEnabled(profile?.twoFactorEnabled === true);
    setSessions(activeSessions || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const startSetup = async () => {
    try {
      setSetup(await setupAdminTwoFactor());
      setCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o 2FA.");
    }
  };

  const confirmSetup = async () => {
    try {
      await confirmAdminTwoFactor(code);
      setSetup(null);
      setCode("");
      setTwoFactorEnabled(true);
      toast.success("Autenticação em duas etapas ativada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Código inválido.");
    }
  };

  const disable = async () => {
    try {
      await disableAdminTwoFactor(password, code);
      setPassword("");
      setCode("");
      setTwoFactorEnabled(false);
      toast.success("Autenticação em duas etapas desativada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível desativar o 2FA.");
    }
  };

  const revoke = async (session: AdminSession) => {
    const response = await revokeAdminSession(session.id);
    if (response.current) {
      await adminAuth.logout();
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    await refresh();
    toast.success("Sessão revogada.");
  };

  const revokeOthers = async () => {
    await revokeOtherAdminSessions();
    await refresh();
    toast.success("As outras sessões foram revogadas.");
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Conta administrativa</p>
        <h1 className="font-display text-3xl md:text-4xl">Segurança</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <h2 className="font-semibold">Autenticação em duas etapas</h2>
              <p className="text-sm text-muted-foreground">
                Exige um código temporário além da senha em cada novo acesso.
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            twoFactorEnabled ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
          }`}>
            {twoFactorEnabled ? "Ativa" : "Desativada"}
          </span>
        </div>

        {!twoFactorEnabled && !setup && <Button onClick={startSetup}>Configurar 2FA</Button>}

        {setup && (
          <div className="rounded-lg bg-secondary/60 p-4 space-y-4">
            <p className="text-sm">
              Abra seu aplicativo autenticador, escolha adicionar uma chave de configuração e informe o segredo abaixo.
            </p>
            <div className="flex gap-2">
              <Input value={setup.secret} readOnly className="font-mono tracking-wider" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.writeText(setup.secret).then(() => toast.success("Chave copiada."))}
                aria-label="Copiar chave"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground break-all">URI: {setup.provisioningUri}</p>
            <div className="max-w-xs">
              <Label>Código de 6 dígitos</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 tracking-[0.3em] text-center"
                placeholder="000000"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmSetup} disabled={code.length !== 6}>Confirmar e ativar</Button>
              <Button variant="outline" onClick={() => setSetup(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
            <div><Label>Senha atual</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div><Label>Código atual</Label><Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
            <Button variant="destructive" onClick={disable} disabled={!password || code.length !== 6}>Desativar 2FA</Button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Laptop className="h-5 w-5" /> Sessões administrativas</h2>
            <p className="text-sm text-muted-foreground">Revogue acessos de dispositivos que você não reconhece.</p>
          </div>
          <Button variant="outline" onClick={revokeOthers}>Revogar outras sessões</Button>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {session.current ? "Este dispositivo" : session.ipAddress || "Dispositivo desconhecido"}
                    {session.revoked && <span className="text-destructive text-xs">Revogada</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{session.userAgent || "Navegador não informado"}</p>
                  <p className="text-xs text-muted-foreground">
                    Último uso: {new Date(session.lastSeenAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                {!session.revoked && (
                  <Button variant="outline" size="sm" onClick={() => revoke(session)}>
                    <LogOut className="h-4 w-4 mr-2" /> Revogar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
