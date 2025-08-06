import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { endpointSortKeys, type listEndpointsSchema } from "@tasks-app/api/schema";
import { PlusCircle } from "lucide-react";

import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { endpointsQueryOptions } from "@/web/lib/queries/endpoints.queries";
import EndpointList from "@/web/routes/~dashboard/~jobs/components/job-endpoint-list";
import { buttonVariants } from "@workspace/ui/components/button";

const routeApi = getRouteApi("/dashboard/jobs/$jobId");

function JobEndpointContainer({ search, jobId }: { search: listEndpointsSchema; jobId: string }) {
  const navigate = routeApi.useNavigate();

  const { data: { items, hasNext } } = useSuspenseQuery(
    endpointsQueryOptions(search, jobId),
  );

  const setParams = (newParams: listEndpointsSchema) => {
    navigate({ search: newParams });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Job Endpoints</h2>
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
        params={search}
        sortKeys={endpointSortKeys as unknown as readonly string[]}
      >
        <EndpointList endpoints={items} />
      </SortingContainer>
    </>
  );
}

export default JobEndpointContainer;
