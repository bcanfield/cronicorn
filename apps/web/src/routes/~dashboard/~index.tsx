import { useSession } from "@hono/auth-js/react";
import { createFileRoute } from "@tanstack/react-router";

import RoutePending from "@/web/components/route-pending";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  pendingComponent: RoutePending,

});

function DashboardPage() {
  const session = useSession();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          Hi
          {session.data?.user?.name}
          !
        </p>
        <p>You are currently on the dashboard route.</p>
      </CardContent>
    </Card>
  );
}
