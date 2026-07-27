import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function RouteLoading() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Carregando página"
    />
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: false,
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: RouteLoading,
  });

  return router;
};
