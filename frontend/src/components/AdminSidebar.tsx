import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Package,
  Receipt,
  Tags,
  History,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  Info,
  Sliders,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Activity,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { adminAuth } from "@/lib/admin-auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type AdminRoute =
  | "/admin"
  | "/admin/home"
  | "/admin/produtos"
  | "/admin/categorias"
  | "/admin/pedidos"
  | "/admin/sobre"
  | "/admin/faq"
  | "/admin/configuracoes"
  | "/admin/auditoria";

interface NavItem {
  to: AdminRoute;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isDark, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // States for collapsible groups
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [screenSettingsOpen, setScreenSettingsOpen] = useState(true);

  const handleLogout = () => {
    adminAuth.logout();
    navigate({ to: "/admin/login" });
  };

  const goToHome = () => {
    navigate({ to: "/" });
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
            <p className="font-display text-xl font-bold">Angell</p>
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

          {/* Go to Home */}
          <button
            onClick={goToHome}
            className="p-2 rounded-lg border border-border hover:bg-secondary text-foreground transition-colors"
            title="Sair para tela inicial"
          >
            <ExternalLink className="h-4 w-4" />
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

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "w-64 shrink-0 border-r border-border/60 bg-secondary/30 h-screen sticky top-0 flex flex-col justify-between z-50 transition-transform duration-200",
          "lg:translate-x-0 fixed lg:sticky top-0 bottom-0 left-0 bg-background lg:bg-secondary/30",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-6 py-6 border-b border-border/60 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-foreground">Angell</p>
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

        {/* Grouped Collapsible Navigation */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Grupo 1: Visão Geral */}
          <div className="space-y-1">
            <button
              onClick={() => setOverviewOpen(!overviewOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" /> Visão Geral
              </span>
              {overviewOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {overviewOpen && (
              <div className="space-y-1 pl-2 border-l border-border/60 ml-2 mt-1">
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname === "/admin"
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> Dashboard
                </Link>
                <Link
                  to="/admin/auditoria"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/auditoria")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <History className="h-3.5 w-3.5 shrink-0" /> Auditoria
                </Link>
              </div>
            )}
          </div>

          {/* Grupo 2: Vendas & Gestão */}
          <div className="space-y-1">
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Vendas & Gestão
              </span>
              {salesOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {salesOpen && (
              <div className="space-y-1 pl-2 border-l border-border/60 ml-2 mt-1">
                <Link
                  to="/admin/pedidos"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/pedidos")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Receipt className="h-3.5 w-3.5 shrink-0" /> Pedidos
                </Link>
                <Link
                  to="/admin/produtos"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/produtos")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Package className="h-3.5 w-3.5 shrink-0" /> Produtos
                </Link>
                <Link
                  to="/admin/categorias"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/categorias")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Tags className="h-3.5 w-3.5 shrink-0" /> Categorias
                </Link>
              </div>
            )}
          </div>

          {/* Grupo 3: Configurações de Tela */}
          <div className="space-y-1">
            <button
              onClick={() => setScreenSettingsOpen(!screenSettingsOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-primary" /> Configurações de Tela
              </span>
              {screenSettingsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {screenSettingsOpen && (
              <div className="space-y-1 pl-2 border-l border-border/60 ml-2 mt-1">
                <Link
                  to="/admin/home"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/home")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Home className="h-3.5 w-3.5 shrink-0" /> Página Home
                </Link>
                <Link
                  to="/admin/sobre"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/sobre")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Info className="h-3.5 w-3.5 shrink-0" /> Sobre Nós
                </Link>
                <Link
                  to="/admin/faq"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/faq")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" /> FAQ / Dúvidas
                </Link>
                <Link
                  to="/admin/configuracoes"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs transition-all",
                    pathname.startsWith("/admin/configuracoes")
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" /> Textos e Políticas
                </Link>
              </div>
            )}
          </div>
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
            onClick={goToHome}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium border border-border/60 text-foreground hover:bg-secondary transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-primary" /> Sair para tela inicial
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
