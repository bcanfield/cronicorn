import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertJobsSchema } from "@tasks-app/api/schema";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { createJob, queryKeys } from "@/web/lib/queries/jobs.queries";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";

export default function JobForm() {
  const queryClient = useQueryClient();
  const form = useForm<insertJobsSchema>({
    defaultValues: { definitionNL: "" },
    resolver: zodResolver(insertJobsSchema),
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
    },
    onSettled: () => setTimeout(() => form.setFocus("definitionNL")),
  });

  return (
    <>
      {createMutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{createMutation.error.message}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(data => createMutation.mutate(data))} className="space-y-6">
          <FormField
            control={form.control}
            name="definitionNL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter job prompt" {...field} disabled={createMutation.isPending} />
                </FormControl>
                <FormDescription>Describe the job prompt.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={createMutation.isPending}>
            Create
          </Button>
        </form>
      </Form>
      {createMutation.isPending && <Loader2 className="animate-spin mt-4" />}
    </>
  );
}
