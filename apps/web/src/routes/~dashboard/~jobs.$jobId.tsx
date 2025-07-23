import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import RoutePending from "@/web/components/route-pending";
import dateFormatter from "@/web/lib/date-formatter";
import { createJobQueryOptions, deleteJob, queryKeys } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";

export const Route = createFileRoute("/dashboard/jobs/$jobId")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(createJobQueryOptions(params.jobId)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(createJobQueryOptions(jobId));

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.LIST_JOBS);
      navigate({ to: "/dashboard" });
    },
  });

  return (
    <article>
      <h2>{data.definitionNL}</h2>
      <h4>
        Status:
        {data.status}
      </h4>
      <h4>
        Next Run:
        {" "}
        {data.nextRunAt ? dateFormatter.format(new Date(data.nextRunAt)) : "N/A"}
      </h4>
      <hr />
      <small>
        Updated:
        {dateFormatter.format(new Date(data.updatedAt))}
      </small>
      <br />
      <small>
        Created:
        {dateFormatter.format(new Date(data.createdAt))}
      </small>
      <div className="buttons">
        <Link to="/dashboard/jobs/$jobId/edit" params={{ jobId }} className="contrast outline" role="button">
          Edit
        </Link>
        <button
          type="button"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="contrast"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
