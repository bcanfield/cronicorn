import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { patchTasksSchema } from "@tasks-app/api/schema";
import { useForm } from "react-hook-form";

import RoutePending from "@/web/components/route-pending";
import { createTaskQueryOptions, deleteTask, queryKeys, updateTask } from "@/web/lib/queries";
import queryClient from "@/web/lib/query-client";

export const Route = createFileRoute("/task/$id/edit")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(createTaskQueryOptions(params.id)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(createTaskQueryOptions(id));

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<patchTasksSchema>({
    defaultValues: data,
    resolver: zodResolver(patchTasksSchema),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.LIST_TASKS);
      navigate({ to: "/" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.LIST_TASKS.queryKey,
          ...queryKeys.LIST_TASK(id).queryKey,
        ],
      });
      navigate({ to: "/task/$id", params: { id } });
    },
  });

  const pending = deleteMutation.isPending || updateMutation.isPending;
  const error = deleteMutation.error?.message || updateMutation.error?.message;

  return (
    <article>
      {pending && <progress />}
      {error && <article className="error">{error}</article>}
      <form onSubmit={handleSubmit(data => updateMutation.mutate({ id, task: data }))}>
        <label>
          Name
          <input {...register("name")} disabled={pending} />
        </label>
        <p className="error">{errors.name?.message}</p>

        <fieldset>
          <label>
            <input type="checkbox" {...register("done")} disabled={pending} />
            Done
          </label>
          <p className="error">{errors.done?.message}</p>
        </fieldset>
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="contrast"
        >
          Save
        </button>
      </form>
      <div className="buttons">
        <button
          type="button"
          onClick={() => deleteMutation.mutate(id)}
          disabled={pending}
          className="contrast"
        >
          Delete
        </button>
        <Link
          role="button"
          to="/task/$id"
          params={{ id }}
          disabled={pending}
          className="contrast outline"
        >
          Cancel
        </Link>
      </div>
    </article>
  );
}
