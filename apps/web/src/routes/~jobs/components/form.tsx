import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertJobsSchema } from "@tasks-app/api/schema";
import { useForm } from "react-hook-form";

import { createJob, queryKeys } from "@/web/lib/queries/jobs.queries";

export default function JobForm() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<insertJobsSchema>({
    defaultValues: { definitionNL: "" },
    resolver: zodResolver(insertJobsSchema),
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries(queryKeys.LIST_JOBS);
    },
    onSettled: () => {
      setTimeout(() => setFocus("definitionNL"));
    },
  });

  return (
    <>
      {createMutation.error && (
        <article className="error" style={{ whiteSpace: "pre-wrap" }}>
          {createMutation.error.message}
        </article>
      )}
      <form onSubmit={handleSubmit(data => createMutation.mutate(data))}>
        <label>
          Prompt
          <textarea
            {...register("definitionNL")}
            disabled={createMutation.isPending}
          />
        </label>
        <p className="error">{errors.definitionNL?.message}</p>

        <button type="submit" disabled={createMutation.isPending}>
          Create
        </button>
      </form>
      {createMutation.isPending && <progress />}
    </>
  );
}
