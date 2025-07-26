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
  loaderDeps: ({ search }) => (search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(jobsQueryOptions(deps)),

});

function DashboardPage() {
  const params = Route.useParams();
  console.log("DashboardPage params:", params);
  return (
    <div>
      {/* <DataTableDemo /> */}
      <JobsSortingContainer params={params} />
      {/* <JobsDataTable /> */}
    </div>
  );
}
