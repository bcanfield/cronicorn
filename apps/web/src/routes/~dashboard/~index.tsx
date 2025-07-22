import { useSession } from "@hono/auth-js/react";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const session = useSession();

  return (
    <section className="grid gap-2 p-2">
      <p>
        Hi
        {session.data?.user?.name}
        !
      </p>
      <p>You are currently on the dashboard route.</p>
    </section>
  );
}
