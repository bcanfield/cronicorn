import { createFileRoute } from "@tanstack/react-router";

import { JobsDataTable } from "@/web/components/jobs-data-table";
import RoutePending from "@/web/components/route-pending";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  pendingComponent: RoutePending,

});

function DashboardPage() {
  return (
    <div>
      {/* <DataTableDemo /> */}
      <JobsDataTable />
    </div>
  );
}
