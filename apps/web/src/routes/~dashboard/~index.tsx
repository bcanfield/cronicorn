import { createFileRoute } from "@tanstack/react-router";
import { listJobsQuerySchema } from "@tasks-app/api/db/query-schemas";

import RoutePending from "@/web/components/route-pending";
import { JobsSortingContainer } from "@/web/features/sorting/SortingContainer";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: listJobsQuerySchema,
  component: DashboardPage,
  pendingComponent: RoutePending,
  // parse and validate search params to match the query schema (provides defaults)
  loaderDeps: ({ search }) => listJobsQuerySchema.parse(search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(jobsQueryOptions(deps)),

});

function DashboardPage() {
  // get validated search params (page, pageSize, sortDirection, etc.)
  const params = Route.useSearch();
  return (
    <div>
      {/* <DataTableDemo /> */}
      <JobsSortingContainer params={params} />
      {/* <JobsDataTable /> */}
    </div>
  );
}
