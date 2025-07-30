import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { createJobQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";
import JobForm from "@/web/routes/~dashboard/~jobs/components/form";

export const Route = createFileRoute("/dashboard/jobs/$jobId")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(createJobQueryOptions(params.jobId)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { jobId } = Route.useParams();
  const { data } = useSuspenseQuery(createJobQueryOptions(jobId));
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate({ to: "/dashboard/jobs" });
  };

  return (
    <>
      <PageHeader title="Update Job" description="Modify the Job Configuration" />

      <JobForm jobId={jobId} initialData={data} onCancel={handleCancel} />

    </>
  );
}
