import { createFileRoute } from "@tanstack/react-router";
import { listJobsQuerySchema } from "@tasks-app/api/schema";

import { JobsDataTable } from "@/web/components/jobs-data-table";
import RoutePending from "@/web/components/route-pending";
import { JobsSortingContainer } from "@/web/features/sorting/SortingContainer";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: listJobsQuerySchema,
  component: DashboardPage,
  pendingComponent: RoutePending,

});

function DashboardPage() {
  const params = Route.useSearch();

  return (
    <div>
      {/* <DataTableDemo /> */}
      <JobsSortingContainer params={params} />
      {/* <JobsDataTable /> */}
    </div>
  );
}
