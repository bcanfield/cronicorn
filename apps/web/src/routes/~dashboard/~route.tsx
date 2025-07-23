import { signOut } from "@hono/auth-js/react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard")({
  pendingComponent: () => (
    <div className="p-4">
      <Alert>
        <AlertTitle>Loading</AlertTitle>
        <AlertDescription>
          <Loader2 className="animate-spin" />
        </AlertDescription>
      </Alert>
    </div>
  ),
  async beforeLoad({ context, location }) {
    const session = await context.session; // Wait for auth to be done loading
    if (session?.status !== "authenticated") {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const handleLogout = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to logout?")) {
      signOut();
    }
  };

  return (
    <div className="p-2 h-full">
      <h1>Authenticated Route</h1>
      <p>This route's content is only visible to authenticated users.</p>
      <div className="py-2 flex gap-2">
        <Button asChild variant="ghost">
          <Link to="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <hr />
      <Outlet />
    </div>
  );
}
