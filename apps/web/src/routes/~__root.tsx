import type { SessionContext } from "@hono/auth-js/react";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export type Session = Parameters<typeof SessionContext>[0]["value"];

export const Route = createRootRouteWithContext<{
  session: Promise<Session>;
}>()({
  component: () => (
    <>
      {/* <AppNavbar /> */}

      <main className="container mt-4">
        <Outlet />
        <TanStackRouterDevtools />
      </main>
    </>
  ),
});
