import type { selectJobsSchema } from "@tasks-app/api/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobsSchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";

type JobFormProps = {
  initialData?: selectJobsSchema;
  mode: "create" | "update";
  onCancel: () => void;
  onSubmit: (data: insertJobsSchema) => Promise<any>;
  onDelete?: () => void;
};
export default function JobForm({ initialData, mode, onCancel, onSubmit, onDelete }: JobFormProps) {
  const form = useForm<insertJobsSchema>({
    defaultValues: initialData,
    resolver: zodResolver(insertJobsSchema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: insertJobsSchema) => {
    setIsLoading(true);
    form.reset(data);
    await onSubmit(data);
    setIsLoading(false);
  };

  return (
    <>

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
          <div className="flex items-center justify-between space-x-2">
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isLoading}
              >
                <X className="size-4" />
                Delete Job
              </Button>
            )}
            <div className="flex items-center gap-2 flex-auto justify-end">
              <Button variant="outline" disabled={isLoading} onClick={onCancel}>
                <X className="size-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                <Save className="size-4" />
                {isLoading ? "Saving..." : mode === "update" ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

    </>
  );
}
