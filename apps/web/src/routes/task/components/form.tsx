import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTasksSchema } from "@tasks-app/api/schema";
import { useForm } from "react-hook-form";

import { createTask, queryKeys } from "@/web/lib/queries";

export default function TaskForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<insertTasksSchema>({
    defaultValues: {
      name: "",
      done: false,
    },
    resolver: zodResolver(insertTasksSchema),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries(queryKeys.LIST_TASKS);
    },
    onSettled: () => {
      setTimeout(() => {
        setFocus("name");
      });
    },
  });

  return (
    <>
      {createMutation.error && (
        <article style={{ whiteSpace: "pre-wrap" }} className="error">
          {createMutation.error.message}
        </article>
      )}
      <form
        onSubmit={handleSubmit(data => createMutation.mutate(data))}
      >
        <label>
          Name
          <input {...register("name")} disabled={createMutation.isPending} />
          <p className="error">{errors.name?.message}</p>
        </label>

        <button type="submit" disabled={createMutation.isPending}>Create</button>
      </form>
      {createMutation.isPending && <progress />}
    </>
  );
}
