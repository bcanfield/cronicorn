import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { JOB_SORT_KEYS, listJobsSchema } from "@tasks-app/api/schema";
import { Briefcase, PlusCircle } from "lucide-react";

import EmptyPlaceholder from "@/web/components/empty-placeholder";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobList from "@/web/routes/~dashboard/~jobs/components/list";
import { buttonVariants } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard/jobs/")({
  component: RouteComponent,
  validateSearch: listJobsSchema,

  pendingComponent: RoutePending,
  loaderDeps: ({ search }) => listJobsSchema.parse(search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(jobsQueryOptions(deps)),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: { items, hasNext } } = useSuspenseQuery(jobsQueryOptions(params));

  const setParams = (newParams: listJobsSchema) => {
    navigate({ search: newParams });
  };

  const showEmptyPlaceholder = items.length === 0 && params.page === 1;
  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Jobs" description="Manage your scheduled jobs" />
        <Link
          to="/dashboard/jobs/create"
          className={buttonVariants()}
        >
          <PlusCircle className="size-4" />
          Create Job
        </Link>

      </div>
      {showEmptyPlaceholder
        ? (<EmptyPlaceholder icon={<Briefcase />} title="No Jobs found" description="You don't have any jobs yet. Create your first job to get started." />)
        : (
            <SortingContainer
              hasNext={hasNext}
              onChange={setParams}
              params={params}
              sortKeys={JOB_SORT_KEYS}
            >
              <JobList jobs={items} />

            </SortingContainer>
          )}

    </>
  );
}
