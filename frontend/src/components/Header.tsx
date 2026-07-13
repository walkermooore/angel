import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./SearchDialog";

const links = [
  { to: "/", label: "Home" },
  { to: "/produtos", label: "Produtos" },
  { to: "/sobre", label: "Sobre Nós" },
] as const;

export function Header() {
  const { count, open } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
          Angel
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm tracking-wide uppercase transition-colors hover:text-foreground",
                pathname === l.to ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={open}
            aria-label="Abrir carrinho"
            className="relative p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center animate-scale-in">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
          <nav className="flex flex-col p-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "py-3 px-2 text-sm tracking-wide uppercase transition-colors",
                  pathname === l.to ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}