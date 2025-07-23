import { signIn } from "@hono/auth-js/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";

import RoutePending from "../components/route-pending";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  pendingComponent: RoutePending,

  async beforeLoad({ context }) {
    const session = await context.session; // Wait for auth to be done loading

    if (session?.status === "authenticated") {
      throw redirect({
        to: "/dashboard",
      });
    }
  },

  component: LoginComponent,
});

function LoginComponent() {
  const search = Route.useSearch();

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-2xl font-semibold">Login</h3>
      {search.redirect
        ? (
            <Alert variant="destructive">
              <AlertDescription>You need to login to access this page.</AlertDescription>
              <AlertTitle>Access denied</AlertTitle>
            </Alert>
          )
        : (
            <p>You need to login to access this page.</p>
          )}
      <Link
        to="/"
        className="text-blue-500 hover:underline"
      >
        Return Home
      </Link>

      <Button onClick={() => signIn("github")}>
        Sign in with GitHub
      </Button>
    </div>
  );
}
