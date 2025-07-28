import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { JOB_SORT_KEYS, listJobsSchema } from "@tasks-app/api/schema";

import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobList from "@/web/routes/~dashboard/components/list";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: listJobsSchema,
  component: DashboardPage,
  pendingComponent: RoutePending,
  // parse and validate search params to match the query schema (provides defaults)
  loaderDeps: ({ search }) => listJobsSchema.parse(search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(jobsQueryOptions(deps)),

});

function DashboardPage() {
  // get validated search params (page, pageSize, sortDirection, etc.)
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: { items, hasNext } } = useSuspenseQuery(jobsQueryOptions(params));

  const setParams = (newParams: listJobsSchema) => {
    navigate({ search: newParams });
  };

  return (
    <SortingContainer
      hasNext={hasNext}
      onChange={setParams}
      params={params}
      sortKeys={JOB_SORT_KEYS}
    >
      <JobList jobs={items} />

    </SortingContainer>

  );
}
