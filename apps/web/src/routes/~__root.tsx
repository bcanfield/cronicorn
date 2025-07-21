import type { SessionContext } from "@hono/auth-js/react";

import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import AppNavbar from "../components/app-navbar";

type Session = Parameters<typeof SessionContext>[0]["value"];

export const Route = createRootRouteWithContext<{
  session: Session;
}>()({
  component: () => (
    <>
      <AppNavbar />
      <main className="container" style={{ marginTop: "1rem" }}>
        <Outlet />
        <TanStackRouterDevtools />
      </main>
    </>
  ),
});
