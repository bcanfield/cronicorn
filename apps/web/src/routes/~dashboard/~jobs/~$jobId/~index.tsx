import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type insertJobsSchema, listEndpointsSchema } from "@tasks-app/api/schema";

import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { endpointsQueryOptions } from "@/web/lib/queries/endpoints.queries";
import { createJobQueryOptions, deleteJob, queryKeys, updateJob } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobForm from "@/web/routes/~dashboard/~jobs/components/form";
import JobEndpointContainer from "@/web/routes/~dashboard/~jobs/components/job-endpoint-container";
import { Separator } from "@workspace/ui/components/separator";

export const Route = createFileRoute("/dashboard/jobs/$jobId/")({
  pendingComponent: RoutePending,
  validateSearch: listEndpointsSchema,
  loaderDeps: ({ search }) => listEndpointsSchema.parse(search),
  loader: async ({ deps, params }) =>
    Promise.all([queryClient.ensureQueryData(createJobQueryOptions(params.jobId)), queryClient.ensureQueryData(endpointsQueryOptions({ ...deps }, params.jobId))]),

  component: RouteComponent,
});

function RouteComponent() {
  const { jobId } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(createJobQueryOptions(jobId));
  const { confirm } = useConfirmationDialog();

  const navigate = useNavigate();

  const updateMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.LIST_JOBS(), queryKeys.LIST_JOB(data.id)] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
      navigate({ to: "/dashboard/jobs" });
    },
  });

  const handleCancel = () => {
    navigate({ to: "/dashboard/jobs" });
  };

  const handleSubmit = async (data: insertJobsSchema) => {
    await updateMutation.mutateAsync({ id: jobId, job: data });
    navigate({ to: "/dashboard/jobs/$jobId", params: { jobId } });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Job",
      description: "Are you sure you want to delete this job?",
      confirmText: "Delete Job",
      variant: "destructive",
    });

    if (confirmed) {
      await deleteMutation.mutateAsync();
    }
  };

  return (
    <>
      <PageHeader title="Update Job" description="Modify the Job Configuration" />

      <JobForm onSubmit={handleSubmit} defaultValues={data} onCancel={handleCancel} mode="update" onDelete={handleDelete} />
      <Separator className="my-6" />

      <JobEndpointContainer search={search} jobId={jobId} />

    </>
  );
}
