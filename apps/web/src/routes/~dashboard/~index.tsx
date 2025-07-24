import { createFileRoute } from "@tanstack/react-router";

import { JobsDataTable } from "@/web/components/JobsDataTable";
import RoutePending from "@/web/components/route-pending";
import { DataTableDemo } from "@/web/routes/~dashboard/components/temp-table";

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
