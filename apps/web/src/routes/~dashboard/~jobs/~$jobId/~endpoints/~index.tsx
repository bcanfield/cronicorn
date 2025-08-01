import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { endpointSortKeys, listEndpointsSchema } from "@tasks-app/api/schema";
import { PlusCircle } from "lucide-react";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { endpointsQueryOptions } from "@/web/lib/queries/endpoints.queries";
import { createJobQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import EndpointList from "@/web/routes/~dashboard/~jobs/~$jobId/~endpoints/components/list";
import { buttonVariants } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard/jobs/$jobId/endpoints/")({
  component: RouteComponent,
  pendingComponent: RoutePending,
  validateSearch: listEndpointsSchema,
  loaderDeps: ({ search }) => listEndpointsSchema.parse(search),

  loader: async ({ deps, params }) => {
    return Promise.all([
      queryClient.ensureQueryData(createJobQueryOptions(params.jobId)),
      queryClient.ensureQueryData(endpointsQueryOptions({ ...deps }, params.jobId)),
    ]);
  },
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { jobId } = Route.useParams();
  const { data: job } = useSuspenseQuery(createJobQueryOptions(jobId));
  const { data: { items, hasNext } } = useSuspenseQuery(
    endpointsQueryOptions(params, jobId),
  );

  const setParams = (newParams: listEndpointsSchema) => {
    navigate({ search: newParams });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Job Endpoints" description={`Job: ${job.id.slice(0, 8)}`} />
        <Link
          to="/dashboard/jobs/$jobId/endpoints/create"
          params={{ jobId }}
          className={buttonVariants()}
        >
          <PlusCircle className="size-4 mr-2" />
          Create Endpoint
        </Link>
      </div>

      <SortingContainer
        hasNext={hasNext}
        onChange={setParams}
        params={params}
        sortKeys={endpointSortKeys as unknown as readonly string[]}
      >
        <EndpointList endpoints={items} />
      </SortingContainer>
    </>
  );
}
