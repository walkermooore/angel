import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const isAuthed = typeof window !== "undefined" && localStorage.getItem("angel:admin") === "1";
    if (!isAuthed) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthed } = useAdminAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === "/admin/login";

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
