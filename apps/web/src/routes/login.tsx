import { signIn, useSession } from "@hono/auth-js/react";
import { createFileRoute, Link, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const fallback = "/dashboard" as const;

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),

  component: LoginComponent,
});

function LoginComponent() {
  const session = useSession();

  const navigate = Route.useNavigate();

  const search = Route.useSearch();

  React.useEffect(() => {
    if (session.status === "authenticated") {
      console.log("Session authenticated, redirecting to", search.redirect || fallback);
      navigate({ to: search.redirect || fallback });
    }
  }, [session.status, search.redirect, navigate]);

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
