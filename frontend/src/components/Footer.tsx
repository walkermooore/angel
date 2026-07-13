import { Instagram, Facebook, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-3xl">Angel</p>
          <p className="text-xs text-muted-foreground mt-2 tracking-wide max-w-xs">
            Joias em prata 925 e cosméticos selecionados. Sofisticação minimalista para o seu dia a dia.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" aria-label="Instagram" className="p-2 rounded-full hover:bg-secondary transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="p-2 rounded-full hover:bg-secondary transition-colors"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest mb-4">Ajuda</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Trocas e Devoluções</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest mb-4">Contato</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@example.invalid</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (11) 99999-9999</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest mb-4">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-3">Receba novidades e ofertas exclusivas.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="seu@email.com" className="flex-1 h-10 rounded-full border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </form>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Angel. Todos os direitos reservados.</span>
          <span>Dados comerciais removidos</span>
        </div>
      </div>
    </footer>
  );
}