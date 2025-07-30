import { useSession } from "@hono/auth-js/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import * as React from "react";

import { routeTree } from "@/web/route-tree.gen";

import type { Session } from "./routes/~__root";

const router = createRouter({
  routeTree,
  context: {
    session: undefined!,
  },
});

declare module "@tanstack/react-router" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}

let resolveAuthClient: (client: Session) => void;
const authClient: Promise<Session> = new Promise(
  (resolve) => { resolveAuthClient = resolve; },
);

export default function App() {
  const hookSession = useSession();
  const isDev = import.meta.env.DEV;

  // Override session in development
  const session = React.useMemo(() => {
    if (isDev) {
      return {
        update: hookSession.update,
        status: "authenticated",
        data: {
          user: { id: "dev-user", name: "Dev User", email: "dev@example.com" },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        },
      };
    }
    return hookSession;
  }, [isDev, hookSession]);

  // Resolve the auth client when session is ready or immediately in dev
  React.useEffect(() => {
    if (session.status !== "loading") {
      resolveAuthClient(session as Session);
    }
  }, [session]);

  return <RouterProvider router={router} context={{ session: authClient }} />;
}
