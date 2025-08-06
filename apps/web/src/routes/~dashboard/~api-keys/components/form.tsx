import { zodResolver } from "@hookform/resolvers/zod";
import { insertApiKeysSchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { DatePicker } from "@/web/components/date-picker";
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
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";

type ApiKeyFormProps = {
  defaultValues?: insertApiKeysSchema;
  onCancel: () => void;
  onSubmit: (data: insertApiKeysSchema) => Promise<void>;
};

export default function ApiKeyForm({ defaultValues, onSubmit, onCancel }: ApiKeyFormProps) {
  const form = useForm<insertApiKeysSchema>({
    resolver: zodResolver(insertApiKeysSchema),
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);

  async function handleFormSubmit(data: insertApiKeysSchema) {
    setIsLoading(true);
    form.reset(data);
    await onSubmit(data);
    setIsLoading(false);
  }

  return (

    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name your API key" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for your API key</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this API key is used for"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <DatePicker
                  placeholder="Never"
                  date={field.value ? new Date(field.value) : undefined}
                  onChange={(date) => {
                    if (date) {
                      field.onChange(date.toISOString());
                    }
                    else {
                      field.onChange(undefined);
                    }
                  }}
                />
              </FormControl>

              <FormDescription>
                Optional. When this API key should expire.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />

        <div className="flex items-center gap-2 flex-auto justify-end">
          <Button variant="outline" disabled={isLoading} onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            <Save className="size-4" />
            {isLoading ? "Saving..." : "Create API Key"}
          </Button>
        </div>

      </form>
    </Form>

  );
}
