import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-3 md:gap-8 items-start text-center md:text-left">
          {/* Column 1: Brand */}
          <div className="flex flex-col items-center md:items-start">
            <p className="font-display text-3xl">Angel</p>
            <p className="text-xs text-muted-foreground mt-3 tracking-wide max-w-xs leading-relaxed">
              Joias em prata 925 e cosméticos selecionados. Sofisticação minimalista para o seu dia a dia.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Ajuda */}
          <div className="flex flex-col items-center">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-semibold mb-4 text-foreground">Ajuda</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground text-center md:text-left">
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/trocas" className="hover:text-foreground transition-colors">Trocas e Devoluções</Link></li>
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">Perguntas Frequentes (FAQ)</Link></li>
              </ul>
            </div>
          </div>

          {/* Column 3: Contato */}
          <div className="flex flex-col items-center md:items-end">
            <div className="text-center md:text-left">
              <h4 className="text-xs uppercase tracking-widest font-semibold mb-4 text-foreground">Atendimento</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4 text-foreground/70" /> contato@example.invalid
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="h-4 w-4 text-foreground/70" /> [contato removido]
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>© {new Date().getFullYear()} Angel. Todos os direitos reservados.</span>
          <span>Dados comerciais removidos</span>
        </div>
      </div>
    </footer>
  );
}