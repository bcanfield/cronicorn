import type { SessionContext } from "@hono/auth-js/react";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Button } from "@workspace/ui/components/button";

import AppNavbar from "../components/app-navbar";

type Session = Parameters<typeof SessionContext>[0]["value"];

export const Route = createRootRouteWithContext<{
  session: Session;
}>()({
  component: () => (
    <>
      <AppNavbar />

      <Button>Hey there</Button>
      <main className="container" style={{ marginTop: "1rem" }}>
        <Outlet />
        <TanStackRouterDevtools />
      </main>
    </>
  ),
});
