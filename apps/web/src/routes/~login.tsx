import { signIn } from "@hono/auth-js/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  pendingComponent: () => (
    <div className="p-2 grid gap-2 place-items-center">
      <h3 className="text-xl">Loading...</h3>
      <p>Please wait while we check your authentication status.</p>
    </div>
  ),
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
    <div className="p-2 grid gap-2 place-items-center">
      <h3 className="text-xl">Login page</h3>
      {search.redirect
        ? (
            <p className="text-red-500">You need to login to access this page.</p>
          )
        : (
            <p>Login to see all the cool content in here.</p>
          )}
      <Link
        to="/"
        className="hover:underline data-[status='active']:font-semibold"
      >
        Return Home
      </Link>

      <button type="button" onClick={async () => await signIn("github")}>Sign in</button>
    </div>
  );
}
