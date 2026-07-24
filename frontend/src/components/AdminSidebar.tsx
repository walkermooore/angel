import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Home, Package, Receipt, Tags, History, HelpCircle, LogOut, Sun, Moon, Menu, X } from "lucide-react";
import { useState } from "react";
import { adminAuth } from "@/lib/admin-auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const items: Array<{
  to: "/admin" | "/admin/home" | "/admin/produtos" | "/admin/categorias" | "/admin/pedidos" | "/admin/auditoria" | "/admin/faq";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/home", label: "Página Home", icon: Home },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/admin/faq", label: "FAQ / Dúvidas", icon: HelpCircle },
  { to: "/admin/auditoria", label: "Auditoria", icon: History },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isDark, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    adminAuth.logout();
    navigate({ to: "/admin/login" });
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg border border-border hover:bg-secondary text-foreground"
            aria-label="Abrir Menu Admin"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <p className="font-display text-xl font-bold">Angel</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={isDark ? "Modo Claro" : "Modo Noturno"}
          >
            {mounted && isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Drawer (Desktop Fixed Sidebar + Mobile Slide-Over) */}
      <aside
        className={cn(
          "w-64 shrink-0 border-r border-border/60 bg-secondary/30 min-h-screen sticky top-0 flex flex-col z-50 transition-transform duration-200",
          "lg:translate-x-0 fixed lg:sticky top-0 bottom-0 left-0 bg-background lg:bg-secondary/30",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-6 py-6 border-b border-border/60 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-foreground">Angel</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Painel Admin</p>
          </div>
          {/* Desktop Dark Mode Icon in Header */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={isDark ? "Modo Claro" : "Modo Noturno"}
          >
            {mounted && isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-foreground text-background font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions in Sidebar */}
        <div className="p-3 border-t border-border/60 space-y-1.5 bg-background/50">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium border border-border/60 text-foreground hover:bg-secondary transition-colors"
          >
            <span className="flex items-center gap-3">
              {mounted && isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              {mounted && isDark ? "Modo Claro" : "Modo Noturno"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" /> Sair do Painel
          </button>
        </div>
      </aside>
    </>
  );
}
