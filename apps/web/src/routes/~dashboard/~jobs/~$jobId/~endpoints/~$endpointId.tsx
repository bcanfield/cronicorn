import type { insertEndpointsSchema } from "@tasks-app/api/schema";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { createEndpointQueryOptions, deleteEndpoint, updateEndpoint } from "@/web/lib/queries/endpoints.queries";
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
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [["list-endpoints"], ["list-endpoint", endpointId]],
      });
      // Navigate back to endpoints list
      navigate({ to: "/dashboard/jobs/$jobId/endpoints", params: { jobId } });
    },
  });

  // Delete mutation
  const { mutateAsync: deleteMutate } = useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-endpoints"] });
      console.log("Endpoint deleted successfully", { endpointId, jobId });
      navigate({ to: "/dashboard/jobs/$jobId/endpoints", params: { jobId } });
    },
  });

  const handleCancel = () => navigate({ to: "/dashboard/jobs/$jobId/endpoints", params: { jobId } });

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
