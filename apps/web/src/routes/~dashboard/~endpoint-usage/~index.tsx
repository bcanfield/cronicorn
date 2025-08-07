import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { listEndpointUsageSchema } from "@tasks-app/api/schema";
import { Activity } from "lucide-react";

import EmptyPlaceholder from "@/web/components/empty-placeholder";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { endpointUsageQueryOptions } from "@/web/lib/queries/endpoint-usage.queries";
import queryClient from "@/web/lib/query-client";
import EndpointUsageList from "@/web/routes/~dashboard/~endpoint-usage/components/usage-list";

// Define the sort keys for endpoint usage
const ENDPOINT_USAGE_SORT_KEYS = ["timestamp", "statusCode", "executionTimeMs", "requestSizeBytes", "responseSizeBytes"] as const;

export const Route = createFileRoute("/dashboard/endpoint-usage/")({
  component: RouteComponent,
  validateSearch: listEndpointUsageSchema,
  pendingComponent: RoutePending,
  loaderDeps: ({ search }) => listEndpointUsageSchema.parse(search),

  loader: ({ deps }) =>
    queryClient.ensureQueryData(endpointUsageQueryOptions(deps as any)),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(endpointUsageQueryOptions(params as any));
  // Using type assertion to handle the response data
  const items = (data as any).items || [];
  const hasNext = !!(data as any).hasNext;

  const setParams = (newParams: any) => {
    navigate({ search: { ...params, ...newParams } });
  };

  const showEmptyPlaceholder = items.length === 0 && params.page === 1;

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Endpoint Usage"
          description="Monitor and analyze your endpoint usage metrics"
        />
      </div>

      {showEmptyPlaceholder
        ? (
            <EmptyPlaceholder
              icon={<Activity />}
              title="No endpoint usage data found"
              description="No endpoint usage records have been collected yet."
            />
          )
        : (
            <SortingContainer
              hasNext={hasNext}
              onChange={setParams}
              params={params}
              sortKeys={ENDPOINT_USAGE_SORT_KEYS}
            >
              <EndpointUsageList
                usageRecords={items}

              />
            </SortingContainer>
          )}
    </>
  );
}
