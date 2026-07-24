import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthed } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = location.pathname === "/admin/login";

  // Redireciona para login se não estiver autenticado (fora da página de login)
  useEffect(() => {
    setAuthChecked(true);
    if (!isLoginPage && !isAuthed) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [isAuthed, isLoginPage, navigate]);

  if (isLoginPage) {
    return <Outlet />;
  }

  // Nunca monta sidebar nem conteúdo administrativo antes da checagem no cliente.
  if (!authChecked || !isAuthed) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col lg:flex-row overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
