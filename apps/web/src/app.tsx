import { useSession } from "@hono/auth-js/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { routeTree } from "@/web/route-tree.gen";

const router = createRouter({
  routeTree,
  context: {
    session: undefined,
  },
});

declare module "@tanstack/react-router" {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const session = useSession();
  return <RouterProvider router={router} context={{ session }} />;
}
