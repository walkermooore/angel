import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Search, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./SearchDialog";

const links = [
  { to: "/", label: "Home" },
  { to: "/produtos", label: "Produtos" },
  { to: "/meu-pedido", label: "Meu Pedido" },
  { to: "/sobre", label: "Sobre Nós" },
] as const;

export function Header() {
  const { count, open } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { isDark, toggleTheme, mounted } = useTheme();

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          Angel
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm tracking-wide uppercase transition-colors hover:text-foreground",
                pathname === l.to ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar modo noturno"
            title={mounted && isDark ? "Modo claro" : "Modo noturno"}
            className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {mounted && isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart Button */}
          <button
            onClick={open}
            aria-label="Carrinho"
            className="relative p-2 rounded-full hover:bg-secondary transition-colors text-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background text-[11px] font-medium flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-full hover:bg-secondary text-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-border/60 bg-background px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block text-sm tracking-wide uppercase py-1.5 transition-colors",
                pathname === l.to ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}