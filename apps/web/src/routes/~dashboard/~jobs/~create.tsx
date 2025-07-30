import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import { createJob, queryKeys } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobForm from "@/web/routes/~dashboard/~jobs/components/form";

export const Route = createFileRoute("/dashboard/jobs/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
      navigate({ to: "/dashboard/jobs/$jobId", params: { jobId: data.id } });
    },
  });

  const handleCancel = () => {
    navigate({ to: "/dashboard/jobs" });
  };
  return (
    <>

      <PageHeader title="Create New Job" description="Configure a new job" />
      <JobForm onSubmit={mutateAsync} mode="create" onCancel={handleCancel} />
    </>
  );
}
