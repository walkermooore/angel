import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthed } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === "/admin/login";

  // Redireciona para login se não estiver autenticado (fora da página de login)
  useEffect(() => {
    if (!isLoginPage && !isAuthed) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [isAuthed, isLoginPage, navigate]);

  if (isLoginPage) {
    return <Outlet />;
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
