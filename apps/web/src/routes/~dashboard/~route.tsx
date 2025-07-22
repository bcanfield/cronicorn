import { signOut } from "@hono/auth-js/react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  pendingComponent: () => (
    <div className="p-2 grid gap-2 place-items-center">
      <h3 className="text-xl">Loading...</h3>
      <p>Please wait while we load your dashboard</p>
    </div>
  ),
  async beforeLoad({ context, location }) {
    const session = await context.session; // Wait for auth to be done loading
    console.log("Session data:", session);
    if (session?.status !== "authenticated") {
      console.log("User not authenticated, redirecting to login");
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      signOut();
    }
  };

  return (
    <div className="p-2 h-full">
      <h1>Authenticated Route</h1>
      <p>This route's content is only visible to authenticated users.</p>
      <ul className="py-2 flex gap-2">
        <li>
          <Link
            to="/dashboard"
            className="hover:underline data-[status='active']:font-semibold"
          >
            Dashboard
          </Link>
        </li>

        <li>
          <button
            type="button"
            className="hover:underline"
            onClick={handleLogout}
          >
            Logout
          </button>
        </li>
      </ul>
      <hr />
      <Outlet />
    </div>
  );
}
