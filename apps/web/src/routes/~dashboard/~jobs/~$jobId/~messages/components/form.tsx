import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessagesSchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
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
import { Textarea } from "@workspace/ui/components/textarea";

type FormProps = {
  defaultValues?: insertMessagesSchema;
  onSubmit: (data: insertMessagesSchema) => Promise<void>;
  mode?: "create" | "update";
  onCancel?: () => void;
  onDelete?: () => void;

};

export default function MessageForm({
  defaultValues,
  onSubmit,
  mode = "create",
  onCancel,
  onDelete,
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

        <div className="flex items-center justify-between space-x-2">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              <X className="size-4" />
              Delete Message
            </Button>
          )}
          <div className="flex items-center gap-2 flex-auto justify-end">
            <Button variant="outline" disabled={isLoading} onClick={onCancel}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
              <Save className="size-4" />
              {isLoading ? "Saving..." : mode === "update" ? "Update Message" : "Create Message"}
            </Button>
          </div>
        </div>

      </form>
    </Form>
  );
}
