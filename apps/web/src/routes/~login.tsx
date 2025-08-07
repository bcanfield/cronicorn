import { signIn } from "@hono/auth-js/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { z } from "zod";

import { SEO } from "@/web/components/seo";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";

import AppLogo from "../../public/horn.svg?react";
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
    <>
      <SEO
        title="Login"
        description="Sign in to your Cronicorn account to manage and monitor your cron jobs and scheduled tasks."
        noindex
        keywords={["login", "sign in", "authentication", "cron jobs"]}
      />
      <div className="p-6 space-y-4 max-w-7xl mx-auto min-h-screen flex flex-col">
        {search.redirect
        && (
          <Alert variant="destructive">
            <AlertDescription>You need to login to access this page.</AlertDescription>
            <AlertTitle>Access denied</AlertTitle>
          </Alert>
        )}
        <div className="flex flex-col flex-auto items-center justify-center space-y-4">
          <div className="max-w-sm w-full flex flex-col items-center text-center space-y-4 ">
            <Link
              to="/"
            >
              <AppLogo className="w-16 h-16" />
            </Link>

            <h1 className="text-3xl font-bold mb-2">Welcome to Cronicorn</h1>
            <p className="text-muted-foreground">Your personal job scheduler</p>
            <Button variant="outline" onClick={() => signIn("github")}>
              <Github className="size-4 text-foreground" />
              Continue with GitHub
            </Button>
          </div>
        </div>

      </div>
    </>
  );
}
