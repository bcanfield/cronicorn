import { createFileRoute, Link } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  pendingComponent: RoutePending,

});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Home Dashboard" />
      <Link to="/dashboard/jobs">
        Jobs
      </Link>
    </div>
  );
}
