import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { adminAuth } from "@/lib/admin-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin — Angel" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillDemo = () => {
    setEmail(adminAuth.credentials.email);
    setPassword(adminAuth.credentials.password);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuth.login(email, password)) {
      toast.success("Bem-vinda de volta!");
      // Usar navegação hard para que o router releia o localStorage do zero
      // e não haja race condition no beforeLoad
      setTimeout(() => {
        window.location.replace("/admin");
      }, 300);
    } else {
      toast.error("Credenciais inválidas. Use a conta de demonstração.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-5">
      <form onSubmit={submit} className="w-full max-w-sm bg-background border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl">Angel</p>
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
          <Button type="submit" className="w-full h-11 rounded-full uppercase tracking-widest text-xs">
            Entrar
          </Button>

          <div
            onClick={fillDemo}
            className="text-xs text-muted-foreground text-center mt-4 cursor-pointer hover:text-foreground transition-colors p-2 rounded border border-border/50 bg-secondary/20"
          >
            Clique aqui para preencher a conta demo: <br />
            <strong>{adminAuth.credentials.email}</strong> / <strong>{adminAuth.credentials.password}</strong>
          </div>
        </div>
      </form>
    </div>
  );
}
