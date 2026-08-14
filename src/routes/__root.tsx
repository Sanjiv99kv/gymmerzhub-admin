import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { AdminShell } from "../components/admin/admin-shell";

const AUTH_PATHS = new Set(["/login"]);

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found.</p>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("[GymmerzHub Admin] Unhandled error:", error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-lime px-4 py-2 text-sm font-medium text-lime-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = AUTH_PATHS.has(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      {isAuthRoute ? (
        <Outlet />
      ) : (
        <AdminShell>
          <Outlet />
        </AdminShell>
      )}
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}
