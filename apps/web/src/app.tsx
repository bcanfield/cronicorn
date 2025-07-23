import { useSession } from "@hono/auth-js/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";

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
  const data = useSession();
  useEffect(() => {
    if (data.status === "loading")
      return;

    resolveAuthClient(data);
  }, [data, data.status]);
  return <RouterProvider router={router} context={{ session: authClient }} />;
}
