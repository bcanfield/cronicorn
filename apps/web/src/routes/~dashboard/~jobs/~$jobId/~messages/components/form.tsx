import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessagesSchema } from "@tasks-app/api/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";

type FormProps = {
  defaultValues?: insertMessagesSchema;
  onSubmit: (data: insertMessagesSchema) => Promise<void>;
  mode?: "create" | "update";
  onCancel?: () => void;
};

export default function MessageForm({
  defaultValues,
  onSubmit,
  mode = "create",
  onCancel,
}: FormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Set up the form with validation
  const form = useForm<insertMessagesSchema>({
    resolver: zodResolver(insertMessagesSchema),
    defaultValues,
  });

  const handleFormSubmit = async (data: insertMessagesSchema) => {
    setIsLoading(true);
    form.reset(data);
    await onSubmit(data);
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter text message content"
                  disabled={isLoading}
                  {...field}
                  rows={6}
                />
              </FormControl>
              <FormDescription>
                Enter the message text content.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Job ID"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The ID of the job this message is associated with.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Submitting..."
              : mode === "create"
                ? "Create Message"
                : "Update Message"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
