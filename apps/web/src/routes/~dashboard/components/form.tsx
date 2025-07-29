import type { selectJobsSchema } from "@tasks-app/api/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { insertJobsSchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createJob, deleteJob, queryKeys, updateJob } from "@/web/lib/queries/jobs.queries";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";

type JobFormProps = {
  // If a jobId is provided, the form will be in update mode
  jobId?: string;
  initialData?: selectJobsSchema;
};
export default function JobForm({ jobId, initialData }: JobFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<insertJobsSchema>({
    defaultValues: initialData,
    resolver: zodResolver(insertJobsSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
    },
    onSettled: () => setTimeout(() => form.setFocus("definitionNL")),
  });

  const updateMutation = useMutation({
    mutationFn: (data: insertJobsSchema) => jobId ? updateJob({ id: jobId, job: data }) : Promise.resolve(),
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
    },
    onSettled: () => setTimeout(() => form.setFocus("definitionNL")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobId ? deleteJob(jobId) : Promise.resolve(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.LIST_JOBS() });
      navigate({ to: "/dashboard/jobs" });
    },
  });

  const handleFormSubmit = async (data: insertJobsSchema) => {
    setIsLoading(true);
    if (jobId) {
      await updateMutation.mutateAsync(data);
    }
    else {
      await createMutation.mutate(data);
    }
    setIsLoading(false);
  };

  return (
    <>
      {createMutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{createMutation.error.message}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="definitionNL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter job prompt" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>Describe the job prompt.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          {/* Form Actions */}
          <div className="flex items-center justify-between space-x-2">
            {/* If jobId is provided, show the delete button */}
            {jobId && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this job?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={isLoading}
              >
                <X className="size-4" />
                Delete Job
              </Button>
            )}
            <div className="flex items-center gap-2 flex-auto justify-end">
              <Link to="/dashboard/jobs" className={buttonVariants({ variant: "outline" })} disabled={isLoading}>
                <X className="size-4" />
                Cancel
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="size-4" />
                {isLoading ? "Saving..." : jobId ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

    </>
  );
}
