import { signOut, useSession } from "@hono/auth-js/react";
import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/__auth")({

  loader: ({ context, location }) => {
    if (!context.session?.data) {
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
