import type { insertEndpointsSchema } from "@tasks-app/api/schema";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { createEndpointQueryOptions, deleteEndpoint, queryKeys, updateEndpoint } from "@/web/lib/queries/endpoints.queries";
import { createJobQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import EndpointForm from "@/web/routes/~dashboard/~jobs/~$jobId/~endpoints/components/form";

export const Route = createFileRoute("/dashboard/jobs/$jobId/endpoints/$endpointId")({
  component: RouteComponent,
  pendingComponent: RoutePending,
  loader: ({ params }) => {
    return Promise.all([
      queryClient.ensureQueryData(createJobQueryOptions(params.jobId)),
      queryClient.ensureQueryData(createEndpointQueryOptions(params.endpointId)),
    ]);
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { jobId, endpointId } = Route.useParams();
  // Get endpoint data
  const { data: endpoint } = useSuspenseQuery(createEndpointQueryOptions(endpointId));

  const { confirm } = useConfirmationDialog();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateEndpoint,
    onSuccess: () => {
      // Invalidate single endpoint query
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_ENDPOINT(endpointId).queryKey,
      });
      // Invalidate list of endpoints for this job
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_ENDPOINTS(jobId),
      });
      // Navigate back to endpoints list
      navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });
    },
  });

  // Delete mutation
  const { mutateAsync: deleteMutate } = useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: () => {
      // Invalidate the specific job's endpoints list
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_ENDPOINTS(jobId),
      });
      // Also invalidate the specific endpoint (though it's deleted, this ensures any cached data is cleared)
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_ENDPOINT(endpointId).queryKey,
      });
      navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });
    },
  });

  const handleCancel = () => navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });

  const handleSubmit = async (data: insertEndpointsSchema) => {
    await updateMutation.mutateAsync({
      id: endpointId,
      endpoint: data,
    });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Endpoint",
      description: "Are you sure you want to delete this Endpoint? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (confirmed) {
      deleteMutate(endpointId);
    }
  };

  return (
    <>
      <PageHeader title="Edit Endpoint" description={`Endpoint: ${endpoint.name}`} />

      <EndpointForm
        defaultValues={endpoint}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        mode="update"
        jobId={jobId}
        onDelete={handleDelete}
      />

    </>
  );
}
