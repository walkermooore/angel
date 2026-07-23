import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Home, Package, Receipt, Tags, History, HelpCircle, LogOut } from "lucide-react";
import { adminAuth } from "@/lib/admin-auth";
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
  return (
    <aside className="w-60 shrink-0 border-r border-border/60 bg-secondary/30 min-h-screen sticky top-0 flex flex-col">
      <div className="px-6 py-6 border-b border-border/60">
        <p className="font-display text-2xl">Angel</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Painel Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                active ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/60">
        <button
          onClick={() => {
            adminAuth.logout();
            navigate({ to: "/admin/login" });
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
}
