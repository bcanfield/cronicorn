import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { JOB_SORT_KEYS, listJobsSchema } from "@tasks-app/api/schema";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobList from "@/web/routes/~dashboard/components/list";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: listJobsSchema,
  component: DashboardPage,
  pendingComponent: RoutePending,
  loaderDeps: ({ search }) => listJobsSchema.parse(search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(jobsQueryOptions(deps)),

});

function DashboardPage() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: { items, hasNext } } = useSuspenseQuery(jobsQueryOptions(params));

  const setParams = (newParams: listJobsSchema) => {
    navigate({ search: newParams });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="Manage your scheduled jobs" />
      <SortingContainer
        hasNext={hasNext}
        onChange={setParams}
        params={params}
        sortKeys={JOB_SORT_KEYS}
      >
        <JobList jobs={items} />

      </SortingContainer>
    </div>
  );
}
