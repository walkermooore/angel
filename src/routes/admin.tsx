import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthed } = useAdminAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthed) navigate({ to: "/admin/login" });
  }, [isAuthed, navigate]);

  if (!isAuthed) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
