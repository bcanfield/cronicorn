import { useSession } from "@hono/auth-js/react";
import { createFileRoute } from "@tanstack/react-router";

import RoutePending from "@/web/components/route-pending";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  pendingComponent: RoutePending,

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
