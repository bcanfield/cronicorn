import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { createEndpoint } from "@/web/lib/queries/endpoints.queries";
import { createJobQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import EndpointForm from "@/web/routes/~dashboard/~jobs/~$jobId/~endpoints/components/form";

export const Route = createFileRoute("/dashboard/jobs/$jobId/endpoints/create")({
  component: RouteComponent,
  pendingComponent: RoutePending,
  loader: ({ params }) => {
    return queryClient.ensureQueryData(createJobQueryOptions(params.jobId));
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { jobId } = Route.useParams();

  const { mutateAsync } = useMutation({
    mutationFn: createEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-endpoints"] });
      navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });
    },
  });

  const handleBack = () => {
    navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });
  };
  return (
    <>
      <PageHeader title="Create Endpoint" description="Configure a new endpoint for this job" />
      <EndpointForm
        onSubmit={async (data) => {
          await mutateAsync(data);
        }}
        onCancel={handleBack}
        mode="create"
        jobId={jobId}
      />
    </>
  );
}
