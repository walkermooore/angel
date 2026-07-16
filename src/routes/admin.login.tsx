import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuth.login(email, password)) {
      toast.success("Bem-vinda de volta");
      navigate({ to: "/admin" });
    } else {
      toast.error("Credenciais inválidas");
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
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1.5" required />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 mt-1.5" required />
          </div>
          <Button type="submit" className="w-full h-11 rounded-full uppercase tracking-widest text-xs">Entrar</Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo: <code>{adminAuth.credentials.email}</code> / <code>{adminAuth.credentials.password}</code>
          </p>
        </div>
      </form>
    </div>
  );
}
