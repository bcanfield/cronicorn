import { createFileRoute, redirect } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SEO } from "@/web/components/seo";

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
    <>
      <SEO
        title="Dashboard"
        description="Your Cronicorn dashboard - manage and monitor all your cron jobs and scheduled tasks in one place."
        keywords={["dashboard", "cron management", "job monitoring", "task overview"]}
      />
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Home Dashboard" />

      </div>
    </>
  );
}
