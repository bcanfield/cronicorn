import { createFileRoute, redirect } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  pendingComponent: RoutePending,
  beforeLoad: () => {
    // redirect to jobs since this page is blank for now
    return redirect({ to: "/dashboard/jobs" });
  },

});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Home Dashboard" />

    </div>
  );
}
