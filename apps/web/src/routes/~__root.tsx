import type { SessionContext } from "@hono/auth-js/react";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export type Session = Parameters<typeof SessionContext>[0]["value"];

export const Route = createRootRouteWithContext<{
  session: Promise<Session>;
}>()({
  component: () => (
    <>
      <div className="mx-auto">
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />

      </div>

    </>
  ),
});
