import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adminAuth } from "@/lib/admin-auth";
import { useTheme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin — Angell" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { isDark, toggleTheme, mounted } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminAuth.login(email, password, requiresTwoFactor ? totpCode : undefined);
      if (result === "success") {
        navigate({ to: "/admin", replace: true });
      } else {
        setRequiresTwoFactor(true);
        toast.info("Informe o código do seu aplicativo autenticador.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível acessar o servidor de autenticação.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-5 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-medium"
        title={isDark ? "Modo Claro" : "Modo Noturno"}
      >
        {mounted && isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
      </button>

      <form onSubmit={submit} className="w-full max-w-sm bg-background border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl">Angell</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Painel administrativo</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest">E-mail</Label>
            <Input
              type="email"
              placeholder="admin@example.invalid"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 mt-1.5"
              required
            />
          </div>
          {requiresTwoFactor && (
            <div>
              <Label className="text-xs uppercase tracking-widest">Código de autenticação</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-11 mt-1.5 tracking-[0.35em] text-center"
                minLength={6}
                required
                autoFocus
              />
            </div>
          )}
          <div>
            <Label className="text-xs uppercase tracking-widest">Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 mt-1.5"
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 rounded-full uppercase tracking-widest text-xs">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
