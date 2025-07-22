import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { patchJobsSchema } from "@tasks-app/api/schema";
import { useForm } from "react-hook-form";

import RoutePending from "@/web/components/route-pending";
import { createJobQueryOptions, queryKeys, updateJob } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";

export const Route = createFileRoute("/jobs/$id/edit")({
  loader: ({ params }) => queryClient.ensureQueryData(createJobQueryOptions(params.id)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(createJobQueryOptions(id));

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<patchJobsSchema>({
    defaultValues: { definitionNL: data.definitionNL },
    resolver: zodResolver(patchJobsSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (job: patchJobsSchema) => updateJob({ id, job }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS.queryKey });
      navigate({ to: "/jobs/$id", params: { id } });
    },
  });

  return (
    <article>
      {updateMutation.isPending && <progress />}
      {updateMutation.error && <article className="error">{updateMutation.error.message}</article>}
      <form onSubmit={handleSubmit(data => updateMutation.mutate(data))}>
        <label>
          Prompt
          <textarea {...register("definitionNL")} disabled={updateMutation.isPending} />
        </label>
        <p className="error">{errors.definitionNL?.message}</p>
        <button type="submit" disabled={!isDirty || updateMutation.isPending} className="contrast">
          Save
        </button>
      </form>
      <div className="buttons">
        <Link to="/jobs/$id" params={{ id }} className="outline" role="button">
          Cancel
        </Link>
      </div>
    </article>
  );
}
